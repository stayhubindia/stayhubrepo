/**
 * HMAC-SHA256 Request Signer
 * ==========================
 * Signs outbound API requests so the backend can verify they originate from
 * a legitimate GharBazar client (not an automated scraper or forged request).
 *
 * Signature scheme:
 *   message   = "{timestamp}:{METHOD}:{path}"
 *   signature = HMAC-SHA256(APP_SECRET, message)  — hex-encoded
 *   header    = X-App-Signature: {timestamp}.{hex_digest}
 *   timestamp = Unix epoch in seconds (replay window ±5 min on server)
 *
 * Security note:
 *   NEXT_PUBLIC_APP_SECRET is visible in browser DevTools — this is an
 *   accepted trade-off for a public web app.  The scheme prevents trivial
 *   automated scraping and replay attacks.  It is NOT a substitute for
 *   proper authentication (JWT) and server-side rate limiting.
 *
 * Returns null when:
 *   - No secret is configured (NEXT_PUBLIC_APP_SECRET is empty)
 *   - crypto.subtle is unavailable (HTTP context without HTTPS)
 *   - Any other signing failure
 * Callers should omit the header when null is returned.
 */

const _enc = new TextEncoder();

async function _importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    _enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function _bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type SignedHeaders = {
  "X-App-Signature": string;
};

/**
 * Signs a request and returns the headers to inject.
 *
 * @param method  HTTP method (GET, POST, …)
 * @param path    Full URL path as seen by the server (e.g. /api/v1/users/me)
 * @param secret  The APP_SECRET shared with the backend
 * @returns       Headers object or null on failure
 */
export async function signRequest(
  method: string,
  path: string,
  secret: string,
): Promise<SignedHeaders | null> {
  if (!secret) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${timestamp}:${method.toUpperCase()}:${path}`;
    const key = await _importKey(secret);
    const sig = await crypto.subtle.sign("HMAC", key, _enc.encode(message));
    return {
      "X-App-Signature": `${timestamp}.${_bufToHex(sig)}`,
    };
  } catch {
    // crypto.subtle not available on HTTP / very old browsers — fail open.
    return null;
  }
}
