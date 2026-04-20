import axios from "axios";

import { API_BASE_URL, APP_SECRET } from "@/config/env";
import { logger } from "@/lib/logger";
import { getDeviceId } from "@/lib/device";
import { signRequest } from "@/lib/request-signer";
import { useAuthStore } from "@/store/auth-store";
import { refreshAuthToken } from "@/modules/auth/api";
import { broadcastSessionExpired, broadcastTokenRefresh } from "@/hooks/use-session-sync";
import type { AxiosRequestConfig, AxiosError } from "axios";

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  noRetryQueue?: boolean;
  metadata?: {
    requestId?: string;
    startedAt?: number;
    queuedReplay?: boolean;
  };
};

// Allowlist of trusted hostnames — requests to any other host are blocked (TASK-06)
const ALLOWED_HOSTS = new Set([new URL(API_BASE_URL).hostname]);

// TTL for retry queue items — drop anything older than 24 hours (TASK-21)
const RETRY_QUEUE_TTL_MS = 24 * 60 * 60 * 1000;

type RefreshQueueItem = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
  config: RetryableRequestConfig;
};

type RefreshState = {
  isRefreshing: boolean;
  queue: RefreshQueueItem[];
};

type GlobalWithRefresh = typeof globalThis & {
  __gb_refresh?: RefreshState;
};

type RetryQueueItem = {
  method: string;
  url: string;
  params?: unknown;
  data?: unknown;
  createdAt: number;
  retries: number;
};

const RETRY_QUEUE_STORAGE_KEY = "gharbazar-http-retry-queue";
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_MAX_QUEUE_ITEMS = 100;
const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

const isBrowser = () => typeof window !== "undefined";

const isSerializablePayload = (payload: unknown) => {
  if (payload === null || payload === undefined) return true;
  if (typeof FormData !== "undefined" && payload instanceof FormData) return false;
  if (typeof Blob !== "undefined" && payload instanceof Blob) return false;
  try {
    JSON.stringify(payload);
    return true;
  } catch {
    return false;
  }
};

const readRetryQueue = (): RetryQueueItem[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RETRY_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop stale items older than TTL (TASK-21)
    const cutoff = Date.now() - RETRY_QUEUE_TTL_MS;
    return parsed.filter((item: RetryQueueItem) => item.createdAt > cutoff);
  } catch {
    return [];
  }
};

const writeRetryQueue = (queue: RetryQueueItem[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(RETRY_QUEUE_STORAGE_KEY, JSON.stringify(queue.slice(0, RETRY_MAX_QUEUE_ITEMS)));
};

const queueContains = (queue: RetryQueueItem[], candidate: RetryQueueItem) =>
  queue.some((item) => item.method === candidate.method && item.url === candidate.url && JSON.stringify(item.params) === JSON.stringify(candidate.params) && JSON.stringify(item.data) === JSON.stringify(candidate.data));

const enqueueRetryRequest = (config: RetryableRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase();
  const url = config.url ?? "";

  if (!MUTATION_METHODS.has(method)) return;
  if (!url || url.includes("/auth/")) return;
  if (config.noRetryQueue) return; // caller opted out of queuing (TASK-21)
  if (!isSerializablePayload(config.data) || !isSerializablePayload(config.params)) return;

  const item: RetryQueueItem = {
    method,
    url,
    params: config.params,
    data: config.data,
    createdAt: Date.now(),
    retries: 0,
  };

  const queue = readRetryQueue();
  if (queueContains(queue, item)) return;

  queue.unshift(item);
  writeRetryQueue(queue);
  logger.warn("Queued request for retry", { method, url, queueSize: queue.length });
};

const isTransientFailure = (error: AxiosError) => {
  const status = error.response?.status;
  const code = error.code;
  return !error.response || code === "ECONNABORTED" || status === 502 || status === 503 || status === 504;
};

let retryQueueInitialized = false;

const replayRetryQueue = async () => {
  if (!isBrowser() || !navigator.onLine) return;

  const queue = readRetryQueue();
  if (!queue.length) return;

  const remaining: RetryQueueItem[] = [];

  for (const item of queue.reverse()) {
    try {
      await http.request({
        method: item.method,
        url: item.url,
        params: item.params,
        data: item.data,
        metadata: { queuedReplay: true },
      } as RetryableRequestConfig);
      logger.debug("Replayed queued request", { method: item.method, url: item.url });
    } catch (err) {
      const maybeAxiosErr = err as AxiosError;
      const nextRetries = item.retries + 1;
      if (isTransientFailure(maybeAxiosErr) && nextRetries < RETRY_MAX_ATTEMPTS) {
        remaining.push({ ...item, retries: nextRetries });
      } else {
        logger.warn("Dropping queued request after retries", {
          method: item.method,
          url: item.url,
          retries: nextRetries,
        });
      }
    }
  }

  writeRetryQueue(remaining);
};

export const initializeOfflineRetryQueue = () => {
  if (!isBrowser() || retryQueueInitialized) return;
  retryQueueInitialized = true;

  window.addEventListener("online", () => {
    void replayRetryQueue();
  });

  if (navigator.onLine) {
    void replayRetryQueue();
  }
};

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use(async (config) => {
  const accessToken = useAuthStore.getState().tokens?.access;
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // ── Correlation & client identity ────────────────────────────────────────
  config.headers["X-Request-ID"] = requestId;
  config.headers["X-Client-App"] = "stayhub-web";
  config.headers["X-Client-Version"] = "v1";
  config.headers["X-Device-ID"] = getDeviceId();

  // ── HMAC request signature ───────────────────────────────────────────────
  // Derives the server-side path from the request config so the signature
  // matches what the backend receives in request.path.
  if (APP_SECRET) {
    try {
      const fullUrl = new URL(config.url ?? "/", config.baseURL ?? API_BASE_URL);
      // Block requests to hosts outside the allowlist (TASK-06 — SSRF prevention)
      if (!ALLOWED_HOSTS.has(fullUrl.hostname)) {
        throw new Error(`Request to disallowed host blocked: ${fullUrl.hostname}`);
      }
      const signed = await signRequest(config.method ?? "get", fullUrl.pathname, APP_SECRET);
      if (signed) {
        config.headers["X-App-Signature"] = signed["X-App-Signature"];
        config.headers["X-Timestamp"] = signed["X-Timestamp"];
      }
    } catch {
      // Non-fatal — skip signing rather than blocking the request.
      logger.warn("Request signing failed; sending unsigned", { url: config.url });
    }
  }

  config.metadata = { requestId, startedAt };
  logger.debug("HTTP request", {
    method: config.method,
    url: `${config.baseURL ?? ""}${config.url ?? ""}`,
    requestId,
  });

  return config;
});

http.interceptors.response.use(
  (response) => {
    const requestId = response.config.metadata?.requestId;
    const startedAt = response.config.metadata?.startedAt;
    logger.debug("HTTP response", {
      method: response.config.method,
      url: `${response.config.baseURL ?? ""}${response.config.url ?? ""}`,
      status: response.status,
      requestId,
      durationMs: typeof startedAt === "number" ? Date.now() - startedAt : undefined,
    });
    return response;
  },
  async (error: AxiosError & { config?: AxiosRequestConfig }) => {
    const requestId = error?.config?.metadata?.requestId;
    const startedAt = error?.config?.metadata?.startedAt;
    const status = error?.response?.status;
    const errorMeta = {
      method: error?.config?.method,
      url: `${error?.config?.baseURL ?? ""}${error?.config?.url ?? ""}`,
      status,
      code: error?.code,
      requestId,
      durationMs: typeof startedAt === "number" ? Date.now() - startedAt : undefined,
    };

    if (typeof status === "number" && status >= 500) {
      logger.error("HTTP server error", errorMeta);
    } else {
      logger.warn("HTTP request failed", errorMeta);
    }

    // Refresh flow: attempt a single in-flight refresh and queue pending requests
    const originalConfig = error.config as RetryableRequestConfig;

    if (status === 401 && originalConfig && !originalConfig._retry) {
      const refresh = useAuthStore.getState().tokens?.refresh;
      if (!refresh) {
        useAuthStore.getState().clearSession();
        broadcastSessionExpired();
        return Promise.reject(error);
      }

      const globalWithRefresh = globalThis as GlobalWithRefresh;

      if (!globalWithRefresh.__gb_refresh) {
        // initialize refresh state on global to keep single-instance across modules
        globalWithRefresh.__gb_refresh = {
          isRefreshing: false,
          queue: [],
        };
      }

      const refreshState = globalWithRefresh.__gb_refresh;

      const retryOriginalRequest = (token: string) => {
        if (!originalConfig.headers) originalConfig.headers = {};
        originalConfig.headers.Authorization = `Bearer ${token}`;
        originalConfig._retry = true;
        return http(originalConfig);
      };

      if (refreshState.isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshState.queue.push({ resolve, reject, config: originalConfig });
        });
      }

      refreshState.isRefreshing = true;

      try {
        const newTokens = await refreshAuthToken(refresh);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setSession(currentUser, newTokens);
          broadcastTokenRefresh(newTokens.access);
        }

        // process queued requests
        refreshState.queue.forEach((p) => {
          if (!p.config.headers) p.config.headers = {};
          p.config.headers.Authorization = `Bearer ${newTokens.access}`;
          p.config._retry = true;
          p.resolve(http(p.config));
        });
        refreshState.queue = [];

        // retry original
        return retryOriginalRequest(newTokens.access);
      } catch (refreshError) {
        // clear queued
        refreshState.queue.forEach((p) => p.reject(refreshError));
        refreshState.queue = [];
        useAuthStore.getState().clearSession();
        broadcastSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        refreshState.isRefreshing = false;
      }
    }

    // If not handled above, clear session on 401 as fallback
    if (status === 401) {
      useAuthStore.getState().clearSession();
      broadcastSessionExpired();
    }

    // Queue transient mutation failures for replay when online.
    if (originalConfig && isTransientFailure(error) && !originalConfig.metadata?.queuedReplay) {
      enqueueRetryRequest(originalConfig);
    }

    return Promise.reject(error);
  },
);
