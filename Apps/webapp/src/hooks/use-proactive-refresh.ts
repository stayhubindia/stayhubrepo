"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { refreshAuthToken } from "@/modules/auth/api";
import { broadcastTokenRefresh, broadcastSessionExpired } from "@/hooks/use-session-sync";
import { logger } from "@/lib/logger";

/**
 * Decode a JWT and return its expiry as a Unix timestamp (seconds).
 * Returns null if the token is malformed.
 */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Refresh when this many milliseconds remain on the access token. */
const REFRESH_BEFORE_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Silently refreshes the access token before it expires.
 *
 * - Schedules a timer to fire `REFRESH_BEFORE_MS` before the JWT `exp`.
 * - On success the store is updated and a BroadcastChannel event is sent to
 *   other tabs so they pick up the new token immediately.
 * - On failure (refresh token invalid / expired) `clearSession` is called and
 *   `onRefreshFailed` is invoked so the caller can redirect to auth.
 * - Safe to call from inside `useEffect` – the timer is cancelled on cleanup.
 */
export function useProactiveTokenRefresh(onRefreshFailed: () => void) {
  const tokens = useAuthStore((s) => s.tokens);
  const onRefreshFailedRef = useRef(onRefreshFailed);

  // Keep the callback ref up-to-date without re-running the effect
  useEffect(() => {
    onRefreshFailedRef.current = onRefreshFailed;
  });

  useEffect(() => {
    if (!tokens?.access) return;

    const exp = decodeJwtExp(tokens.access);
    if (exp === null) return;

    const expiresAtMs = exp * 1000;
    const fireAtMs = expiresAtMs - REFRESH_BEFORE_MS;
    const delayMs = fireAtMs - Date.now();

    // Token already expired or within the refresh window — attempt now
    const scheduleMs = Math.max(0, delayMs);

    const timer = setTimeout(async () => {
      const refreshToken = useAuthStore.getState().tokens?.refresh;
      if (!refreshToken) {
        useAuthStore.getState().clearSession();
        broadcastSessionExpired();
        onRefreshFailedRef.current();
        return;
      }

      try {
        const newTokens = await refreshAuthToken(refreshToken);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setSession(currentUser, newTokens);
          broadcastTokenRefresh(newTokens.access);
          logger.debug("Proactive token refresh succeeded");
        }
      } catch (err) {
        logger.warn("Proactive token refresh failed — clearing session", { err });
        useAuthStore.getState().clearSession();
        broadcastSessionExpired();
        onRefreshFailedRef.current();
      }
    }, scheduleMs);

    return () => clearTimeout(timer);
  }, [tokens?.access]);
}
