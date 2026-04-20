/**
 * Cross-Tab Session Synchronization
 *
 * Handles session state synchronization across browser tabs/windows.
 * Uses BroadcastChannel (modern) with localStorage fallback (older browsers).
 *
 * Syncs:
 * - Token refresh/expiry
 * - Logout in one tab clearing all tabs
 * - Session warning dismissal across tabs
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";

type SessionEvent = 
 | { type: "logout" }
  | { type: "token-refresh"; accessToken: string }
  | { type: "warning-acknowledged" }
  | { type: "session-expired" };

const CHANNEL_NAME = "session-sync";
const STORAGE_KEY = "session-event";

type SessionEventEnvelope = SessionEvent & {
  eventId: string;
  timestamp: number;
  sourceTabId: string;
};

function getTabId() {
  if (typeof window === "undefined") return "server";
  const key = "gharbazar-tab-id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = `tab-${Math.random().toString(36).slice(2, 12)}`;
  window.sessionStorage.setItem(key, created);
  return created;
}

/**
 * Broadcasts session events to other tabs/windows
 */
function broadcastSessionEvent(event: SessionEvent) {
  const envelope: SessionEventEnvelope = {
    ...event,
    eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: Date.now(),
    sourceTabId: getTabId(),
  };

  // Try BroadcastChannel first (modern browsers)
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(envelope);
      channel.close();
      return;
    } catch {
      // Fall through to localStorage
    }
  }

  // Fall back to localStorage events (older browsers)
  if (typeof window !== "undefined" && "localStorage" in window) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Storage quota exceeded or unavailable, silently fail
    }
  }
}

/**
 * Hook to sync session state across tabs
 * Handles: logout, token refresh, session expiry
 */
export function useSessionSync(
  onLogout?: () => void,
  onTokenRefresh?: (newToken: string) => void,
  onSessionExpired?: () => void,
) {
  const { clearSession, setSession } = useAuthStore();
  const channelRef = useRef<BroadcastChannel | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const tabIdRef = useRef<string>("server");

  // Listen for events from other tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    tabIdRef.current = getTabId();

    const markSeen = (eventId: string) => {
      seenEventIdsRef.current.add(eventId);
      if (seenEventIdsRef.current.size > 100) {
        const first = seenEventIdsRef.current.values().next().value;
        if (first) seenEventIdsRef.current.delete(first);
      }
    };

    const handleIncomingEvent = (event: SessionEventEnvelope) => {
      if (event.sourceTabId === tabIdRef.current) return;
      if (seenEventIdsRef.current.has(event.eventId)) return;
      markSeen(event.eventId);

      if (event.type === "logout") {
        clearSession();
        onLogout?.();
        return;
      }

      if (event.type === "token-refresh" && event.accessToken) {
        const current = useAuthStore.getState();
        if (current.user && current.tokens) {
          setSession(current.user, {
            access: event.accessToken,
            refresh: current.tokens.refresh,
          });
          onTokenRefresh?.(event.accessToken);
        }
        return;
      }

      if (event.type === "session-expired") {
        onSessionExpired?.();
        clearSession();
      }
    };

    // BroadcastChannel listener (modern)
    if ("BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<SessionEventEnvelope>) => {
          handleIncomingEvent(event.data);
        };

        return () => {
          channel.close();
          channelRef.current = null;
        };
      } catch {
        // BroadcastChannel not available, fall through to storage
      }
    }

    // localStorage listener fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;

      // Debounce: ignore events fired by this tab
      try {
        const event = JSON.parse(e.newValue) as SessionEventEnvelope;
        handleIncomingEvent(event);
      } catch {
        // Invalid event JSON, ignore
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [clearSession, setSession, onLogout, onTokenRefresh, onSessionExpired]);

  // Expose broadcast function for manual calls
  return { broadcastSessionEvent };
}

/**
 * Broadcasts logout to all other tabs
 */
export function broadcastLogout() {
  broadcastSessionEvent({ type: "logout" });
}

/**
 * Broadcasts token refresh to all other tabs
 */
export function broadcastTokenRefresh(accessToken: string) {
  broadcastSessionEvent({ type: "token-refresh", accessToken });
}

/**
 * Broadcasts session expiry to all other tabs
 */
export function broadcastSessionExpired() {
  broadcastSessionEvent({ type: "session-expired" });
}
