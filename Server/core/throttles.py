from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Strict rate limiting for authentication endpoints"""
    scope = "auth"

    def allow_request(self, request, view):
        from django.conf import settings
        if settings.DEBUG:
            return True
        return super().allow_request(request, view)


class ContactRateThrottle(UserRateThrottle):
    """Rate limiting for contact creation to prevent spam"""
    scope = "contact"

    def allow_request(self, request, view):
        from django.conf import settings
        if settings.DEBUG:
            return True
        return super().allow_request(request, view)


class IPRateThrottle(SimpleRateThrottle):
    """
    Per-IP rate throttle for DRF views that need finer endpoint-level control
    on top of the global IP limit enforced by ClientVerificationMiddleware.

    Uses request.client_ip set by ClientVerificationMiddleware.
    Falls back to REMOTE_ADDR when middleware is not in the stack.
    """
    scope = "ip"

    def get_cache_key(self, request, view):
        ip = getattr(request, "client_ip", None) or (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR", "unknown")
        )
        return self.cache_format % {"scope": self.scope, "ident": ip}


class DeviceRateThrottle(SimpleRateThrottle):
    """
    Per-device rate throttle using the stable device ID sent by the client
    in the X-Device-ID header (set on request by ClientVerificationMiddleware).

    Use this on sensitive endpoints to limit abuse per device/browser.
    """
    scope = "device"

    def get_cache_key(self, request, view):
        device_id = getattr(request, "client_device_id", "") or "unknown"
        return self.cache_format % {"scope": self.scope, "ident": device_id}


class SignupRateThrottle(AnonRateThrottle):
    """Tighter limit on account creation to prevent bulk registration."""
    scope = "signup"

    def allow_request(self, request, view):
        from django.conf import settings
        if settings.DEBUG:
            return True
        return super().allow_request(request, view)
