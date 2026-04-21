"""
Client Verification Middleware
==============================
Validates every inbound API request for:

  1. Per-IP rate limiting    — blocks floods before they reach views/DB.
  2. Client-App identity     — X-Client-App must be a known identifier.
  3. HMAC request signature  — X-App-Signature = {timestamp}.{HMAC-SHA256}
                               prevents request forgery and replay attacks.
  4. Client metadata         — attaches ip, device_id, user_agent to request
                               for downstream logging and per-device throttling.

Signature scheme:
  secret  = APP_SECRET (shared env var, never in source)
  message = f"{timestamp}:{METHOD}:{path}"
  header  = X-App-Signature: {timestamp}.{hex_digest}
  window  = ±5 minutes  (replay attack protection)

Signature check is SKIPPED when:
  - Request method is OPTIONS  (CORS pre-flight)
  - Path is in EXEMPT_PATHS   (health, schema, docs)
  - DEBUG=True AND REQUIRE_CLIENT_SIGNATURE is not explicitly True
"""

import hashlib
import hmac
import logging
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------

# Identifiers accepted in X-Client-App.
ALLOWED_CLIENT_APPS: frozenset[str] = frozenset({
    "stayhub-web",
    "stayhub-admin",
    "stayhub-mobile",
})

# Paths that skip ALL validation (metadata is still attached).
# Include token/refresh because it's called with raw axios (no interceptor)
# to avoid circular refresh-loop triggering itself.
# Include all public auth endpoints — they are rate-limited at the DRF level
# via AuthRateThrottle instead, and must never be blocked before login.
EXEMPT_PATHS: frozenset[str] = frozenset({
    "/api/v1/health/",
    "/api/v1/schema/",
    "/api/v1/docs/",
    # Auth — public endpoints (no token yet, protected by AuthRateThrottle)
    "/api/v1/auth/firebase/login/",     # Google OAuth
    "/api/v1/auth/firebase/link/",      # Link Google to existing account
    "/api/v1/auth/email-otp/request/",  # Request email OTP
    "/api/v1/auth/email-otp/verify/",   # Verify email OTP
    "/api/v1/auth/token/refresh/",      # JWT refresh
})

# Per-IP sliding-window limit.  Overridden by settings if present.
_IP_RATE_LIMIT: int = getattr(settings, "CLIENT_IP_RATE_LIMIT", 600)
_IP_RATE_WINDOW: int = getattr(settings, "CLIENT_IP_RATE_WINDOW_SECONDS", 3600)  # 1 h


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

def _get_client_ip(request) -> str:
    """
    Return the originating client IP.
    Reads X-Forwarded-For first (leftmost entry = real client when behind
    a reverse proxy / load balancer that appends to the chain).
    """
    xff: str = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _verify_hmac(secret: str, method: str, path: str, ts_str: str, recv_hex: str) -> bool:
    """
    Constant-time HMAC-SHA256 verification.
    Returns False on any format error, stale timestamp, or bad signature.
    """
    try:
        ts = int(ts_str)
    except (ValueError, TypeError):
        return False

    # Reject requests outside the ±5-minute replay window.
    if abs(int(time.time()) - ts) > 300:
        return False

    message = f"{ts_str}:{method.upper()}:{path}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, recv_hex)


def _check_ip_rate_limit(ip: str) -> bool:
    """
    Sliding counter per IP using the configured cache backend (Redis).
    Returns True when allowed, False when the limit is exceeded.
    Fails open when the cache is unavailable so Redis outages don't block
    legitimate traffic — a hard block would be the wrong trade-off here.
    """
    key = f"iprl:{ip}"
    try:
        count: int = cache.get(key, 0)
        if count >= _IP_RATE_LIMIT:
            return False
        if count == 0:
            cache.set(key, 1, timeout=_IP_RATE_WINDOW)
        else:
            cache.incr(key)
        return True
    except Exception:
        logger.warning("IP rate-limit cache unavailable; failing open", extra={"ip": ip})
        return True


def _json_error(detail: str, code: str, status: int) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "detail": detail}}, status=status)


# -----------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------

class ClientVerificationMiddleware:
    """
    Django WSGI/ASGI-compatible middleware for API client verification.

    Attach to MIDDLEWARE AFTER CorsMiddleware so that pre-flight (OPTIONS)
    responses from CORS are already handled and we never block them.

    Order in settings.MIDDLEWARE:
        "corsheaders.middleware.CorsMiddleware",   ← before
        "core.middleware.ClientVerificationMiddleware",
        "django.middleware.common.CommonMiddleware",
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.app_secret: str | None = getattr(settings, "APP_SECRET", None)
        # Default: require signature in production, skip in DEBUG.
        self.require_signature: bool = getattr(
            settings,
            "REQUIRE_CLIENT_SIGNATURE",
            not settings.DEBUG,
        )

    def __call__(self, request):
        # ── Skip OPTIONS (CORS pre-flight); CORS middleware handles those. ──
        if request.method == "OPTIONS":
            return self.get_response(request)

        # ── Only process /api/ routes. ────────────────────────────────────
        if not request.path.startswith("/api/"):
            return self.get_response(request)

        # ── Attach client metadata (always, even for exempt paths). ───────
        request.client_ip = _get_client_ip(request)
        request.client_device_id = request.META.get("HTTP_X_DEVICE_ID", "")
        request.client_user_agent = request.META.get("HTTP_USER_AGENT", "")
        request.client_app = request.META.get("HTTP_X_CLIENT_APP", "")
        request.client_request_id = request.META.get("HTTP_X_REQUEST_ID", "")

        # ── Exempt paths skip validation. ─────────────────────────────────
        if request.path in EXEMPT_PATHS:
            return self.get_response(request)

        # ── 1. Per-IP rate limit ──────────────────────────────────────────
        if not _check_ip_rate_limit(request.client_ip):
            logger.warning(
                "IP rate limited",
                extra={"ip": request.client_ip, "path": request.path},
            )
            return _json_error(
                "Too many requests. Please wait and try again.",
                "rate_limited",
                429,
            )

        # ── 2. X-Client-App validation ────────────────────────────────────
        # In DEBUG mode this is a soft warning only — allows tools like
        # Postman, curl, or missing env vars to reach the API without
        # blocking the dev loop.  In production this is always enforced.
        if request.client_app not in ALLOWED_CLIENT_APPS:
            if not settings.DEBUG:
                logger.warning(
                    "Rejected unknown client app",
                    extra={
                        "client_app": request.client_app,
                        "ip": request.client_ip,
                        "path": request.path,
                    },
                )
                return _json_error(
                    "Unauthorized client application.",
                    "invalid_client",
                    401,
                )
            logger.debug(
                "Unknown client app (allowed in DEBUG)",
                extra={"client_app": request.client_app, "path": request.path},
            )

        # ── 3. HMAC signature verification ────────────────────────────────
        if self.require_signature:
            if not self.app_secret:
                logger.error(
                    "APP_SECRET not set but REQUIRE_CLIENT_SIGNATURE=True"
                )
                return _json_error("Server misconfiguration.", "server_error", 500)

            sig_header: str = request.META.get("HTTP_X_APP_SIGNATURE", "")
            if "." not in sig_header:
                return _json_error(
                    "Missing or malformed request signature.",
                    "missing_signature",
                    401,
                )

            timestamp_str, _, recv_hex = sig_header.partition(".")

            if not _verify_hmac(
                self.app_secret,
                request.method,
                request.path,
                timestamp_str,
                recv_hex,
            ):
                logger.warning(
                    "Invalid request signature",
                    extra={
                        "ip": request.client_ip,
                        "path": request.path,
                        "client_app": request.client_app,
                        "device_id": request.client_device_id,
                    },
                )
                return _json_error(
                    "Invalid or expired request signature.",
                    "invalid_signature",
                    401,
                )

        return self.get_response(request)
