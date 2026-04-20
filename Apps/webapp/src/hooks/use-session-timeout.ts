"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Decode JWT payload without a library.
 * Returns null if decoding fails.
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

const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL_MS = 60 * 1000; // check every 60 seconds

/**
 * Shows a warning callback when the access token is about to expire.
 * Call this once in the authenticated layout.
 */
export function useSessionTimeoutWarning(onWarning: (minutesLeft: number) => void) {
  const tokens = useAuthStore((s) => s.tokens);
  const warned = useRef(false);

  const checkExpiry = useCallback(() => {
    if (!tokens?.access) return;

    const exp = decodeJwtExp(tokens.access);
    if (exp === null) return;

    const expiresAtMs = exp * 1000;
    const timeLeftMs = expiresAtMs - Date.now();

    if (timeLeftMs <= 0) {
      // Already expired — refresh interceptor will handle it
      return;
    }

    if (timeLeftMs <= WARNING_BEFORE_MS && !warned.current) {
      warned.current = true;
      const minutesLeft = Math.max(1, Math.ceil(timeLeftMs / 60_000));
      onWarning(minutesLeft);
    }
  }, [tokens?.access, onWarning]);

  useEffect(() => {
    // Reset warning flag when token changes (e.g., after refresh)
    warned.current = false;
  }, [tokens?.access]);

  useEffect(() => {
    if (!tokens?.access) return;

    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tokens?.access, checkExpiry]);
}
