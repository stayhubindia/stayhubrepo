/**
 * Stable Device ID
 * ================
 * Generates and persists a random UUID that identifies this browser/device.
 * Sent as `X-Device-ID` on every API request so the server can:
 *   - Apply per-device rate limiting (DeviceRateThrottle)
 *   - Detect anomalous device switching for the same session
 *   - Correlate logs without relying on user identity
 *
 * Privacy: this is an anonymous random ID with no fingerprinting.
 * It is stored in localStorage and is reset if the user clears their data.
 *
 * During SSR (server-side rendering) a static placeholder is returned
 * because localStorage is not available in Node.js.
 */

const DEVICE_ID_KEY = "gb-device-id";

/**
 * Returns a stable device/browser ID.
 * Creates and persists one on first call.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    // SSR: no localStorage — return a static placeholder.
    return "ssr";
  }

  try {
    const stored = window.localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    const id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // localStorage blocked (e.g. private-browsing restrictions, iframe sandbox).
    return "unknown";
  }
}
