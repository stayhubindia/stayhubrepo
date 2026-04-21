from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from corsheaders.defaults import default_headers
from django.core.exceptions import ImproperlyConfigured

# ======================================================
# BASE
# ======================================================

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def get_env(key, default=None):
    return os.getenv(key, default)


def get_secret(key, file_key=None, default=None):
    file_path = os.getenv(file_key) if file_key else None
    if file_path:
        # Resolve to absolute path to prevent path traversal (TASK-11)
        resolved = Path(file_path).resolve()
        if resolved.is_file():
            return resolved.read_text(encoding="utf-8").strip()
    return os.getenv(key, default)


# ======================================================
# SECURITY
# ======================================================

SECRET_KEY = get_secret("SECRET_KEY")

if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY is required — set SECRET_KEY in .env")

DEBUG = get_env("DEBUG", "False") == "True"

# Shared HMAC secret for client request signing (X-App-Signature).
# Must be a long random hex string (min 32 bytes / 64 hex chars).
# Generate with: python -c "import secrets; print(secrets.token_hex(64))"
APP_SECRET: str | None = get_secret("APP_SECRET", "APP_SECRET_FILE")

# Set to True to require HMAC signature on every API call.
# Defaults to True in production (not DEBUG), False in development.
REQUIRE_CLIENT_SIGNATURE: bool = (
    get_env("REQUIRE_CLIENT_SIGNATURE", "True" if not DEBUG else "False") == "True"
)

# Per-IP global rate limit enforced by ClientVerificationMiddleware.
CLIENT_IP_RATE_LIMIT: int = int(get_env("CLIENT_IP_RATE_LIMIT", "600"))           # requests
CLIENT_IP_RATE_WINDOW_SECONDS: int = int(get_env("CLIENT_IP_RATE_WINDOW_SECONDS", "3600"))  # 1 hour
ALLOWED_HOSTS = [
    h.strip() for h in get_env("ALLOWED_HOSTS", "").split(",") if h.strip()
]

if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS must be set in production — set ALLOWED_HOSTS in .env")

# Trust reverse-proxy headers so DRF builds correct absolute URLs (pagination
# `next`/`previous` fields) when running behind dev tunnels or load balancers.
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Security Headers (Production)
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = "DENY"

# Cross-Origin-Opener-Policy
# Must be "same-origin-allow-popups" (not "same-origin") so that
# Firebase signInWithPopup can communicate window.closed back to the opener.
# Django SecurityMiddleware defaults this to "same-origin" which breaks OAuth popups.
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"


# ======================================================
# APPLICATIONS
# ======================================================

INSTALLED_APPS = [
    # Django Core
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",

    # Third Party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "channels",
    "cloudinary_storage",
    "cloudinary",
    "drf_spectacular",

    # Local Apps
    "core",
    "apps.users",
    "apps.properties",
    "apps.favorites",
    "apps.contacts",
    "apps.notifications",
    "apps.communication",
    "apps.analytics",
]


# ======================================================
# MIDDLEWARE
# ======================================================

MIDDLEWARE = [
    
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    # Client verification: IP rate-limit, app identity, HMAC signature.
    # Must come AFTER CorsMiddleware so OPTIONS pre-flights are handled first.
    "core.middleware.ClientVerificationMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "server.urls"
ASGI_APPLICATION = "server.asgi.application"

TEMPLATES = []  # API only


# ======================================================
# DATABASE (PostgreSQL)
# ======================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": get_env("PSQL_DB_NAME"),
        "USER": get_env("PSQL_USER"),
        "PASSWORD": get_secret("PSQL_PASSWORD"),
        "HOST": get_env("PSQL_HOST"),
        "PORT": get_env("PSQL_PORT"),
        "OPTIONS": {
            "sslmode": "require",
        },
    }
}

AUTH_USER_MODEL = "users.User"


# ======================================================
# PASSWORD VALIDATION
# ======================================================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ======================================================
# REST FRAMEWORK
# ======================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Built-in scopes
        "user": "1000/day",
        "anon": "100/day",
        # Auth & account flows
        "auth": "5/hour",
        "signup": "3/hour",
        # Feature-level scopes
        "contact": "10/hour",
        "contact_create": "10/hour",
        "message_send": "30/minute",
        "property_read": "1000/hour",
        "property_write": "100/hour",
        # Analytics
        "analytics_read": "200/hour",
        # Client-identity scopes (IPRateThrottle / DeviceRateThrottle)
        "ip": "300/hour",
        "device": "500/hour",
    },
}


# ======================================================
# API DOCUMENTATION
# ======================================================

SPECTACULAR_SETTINGS = {
    "TITLE": "Stayhub India API",
    "DESCRIPTION": "Rental property platform API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "ENUM_NAME_OVERRIDES": {
        "UserRoleEnum": ["OWNER", "TENANT", "ADMIN"],
        "ConversationStatusEnum": ["ACTIVE", "ARCHIVED"],
        "PropertyStatusEnum": ["DRAFT", "PENDING", "ACTIVE", "RENTED", "EXPIRED", "REJECTED"],
        "PreferredTenantEnum": ["MALE", "FEMALE", "ANY"],
    },
}


# ======================================================
# JWT
# ======================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "SIGNING_KEY": get_secret("JWT_SECRET_KEY", "JWT_SECRET_KEY_FILE", SECRET_KEY),
}

CHAT_WS_BURST_LIMIT_PER_SEC = int(get_env("CHAT_WS_BURST_LIMIT_PER_SEC", "3"))
CHAT_WS_SUSTAINED_LIMIT_PER_MIN = int(get_env("CHAT_WS_SUSTAINED_LIMIT_PER_MIN", "10"))


# ======================================================
# CORS
# ======================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in get_env("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CORS_ALLOW_ALL_ORIGINS = DEBUG and not CORS_ALLOWED_ORIGINS

CORS_ALLOW_HEADERS = [
    *default_headers,
    # Correlation & client identity
    "x-request-id",
    "x-client-app",
    "x-client-version",
    # Security headers added by ClientVerificationMiddleware
    "x-app-signature",   # HMAC-SHA256 request signature
    "x-device-id",       # Stable browser/device identifier
]

CORS_EXPOSE_HEADERS = ["X-Request-ID"]


# ======================================================
# REDIS & CHANNELS
# ======================================================

REDIS_URL = get_env("REDIS_URL", "redis://127.0.0.1:6379/0")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    }
}


# ======================================================
# CELERY
# ======================================================

CELERY_BROKER_URL = get_env("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = get_env("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TASK_ALWAYS_EAGER = get_env("CELERY_TASK_ALWAYS_EAGER", "False") == "True"


# ======================================================
# CACHE
# ======================================================

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}


# ======================================================
# INTERNATIONALIZATION
# ======================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = get_env("TIME_ZONE", "Asia/Kolkata")
USE_I18N = True
USE_TZ = True


# ======================================================
# STATIC & MEDIA
# ======================================================

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

CLOUDINARY_CLOUD_NAME = get_env("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = get_secret("CLOUDINARY_API_KEY", "CLOUDINARY_API_KEY_FILE")
CLOUDINARY_API_SECRET = get_secret("CLOUDINARY_API_SECRET", "CLOUDINARY_API_SECRET_FILE")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": CLOUDINARY_CLOUD_NAME,
        "API_KEY": CLOUDINARY_API_KEY,
        "API_SECRET": CLOUDINARY_API_SECRET,
        "SECURE": True,
    }

    STORAGES = {
        "default": {
            "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }


# ======================================================
# DEFAULT AUTO FIELD
# ======================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ======================================================
# FIREBASE ADMIN SDK
# ======================================================

try:
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps and get_env("FIREBASE_PROJECT_ID"):
        private_key = get_env("FIREBASE_PRIVATE_KEY", "")
        # Handle both \n and \\n in the private key
        private_key = private_key.replace("\\n", "\n").replace("\\\\n", "\n")
        
        firebase_config = {
            "type": get_env("FIREBASE_TYPE"),
            "project_id": get_env("FIREBASE_PROJECT_ID"),
            "private_key_id": get_env("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": get_env("FIREBASE_CLIENT_EMAIL"),
            "client_id": get_env("FIREBASE_CLIENT_ID"),
            "auth_uri": get_env("FIREBASE_AUTH_URI"),
            "token_uri": get_env("FIREBASE_TOKEN_URI"),
            "auth_provider_x509_cert_url": get_env("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
            "client_x509_cert_url": get_env("FIREBASE_CLIENT_X509_CERT_URL"),
        }
        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred)
except (ValueError, ImportError, KeyError) as e:
    if DEBUG:
        print(f"Firebase initialization warning: {e}")

BREVO_API_KEY=get_secret("BREVO_API_KEY")
BREVO_SENDER_EMAIL=get_env("BREVO_SENDER_EMAIL")


# ======================================================
# OTP CONFIGURATION
# ======================================================

EMAIL_OTP_LENGTH = int(get_env("EMAIL_OTP_LENGTH", "6"))
EMAIL_OTP_TTL_MINUTES = int(get_env("EMAIL_OTP_TTL_MINUTES", "10"))
EMAIL_OTP_MAX_ATTEMPTS = int(get_env("EMAIL_OTP_MAX_ATTEMPTS", "5"))
EMAIL_OTP_DAILY_LIMIT = int(get_env("EMAIL_OTP_DAILY_LIMIT", "10"))
EMAIL_OTP_LOCKOUT_MINUTES = int(get_env("EMAIL_OTP_LOCKOUT_MINUTES", "15"))
EMAIL_OTP_SECRET = get_env("EMAIL_OTP_SECRET", SECRET_KEY)
EMAIL_OTP_USE_ASYNC = get_env("EMAIL_OTP_USE_ASYNC", "True") == "True"

DISPOSABLE_EMAIL_DOMAINS = [
    d.strip().lower()
    for d in get_env(
        "DISPOSABLE_EMAIL_DOMAINS",
        "tempmail.com,mailinator.com,guerrillamail.com,10minutemail.com",
    ).split(",")
    if d.strip()
]

# ======================================================
# AUDIT LOGGING
# ======================================================

AUDIT_LOG_ENABLED = get_env("AUDIT_LOG_ENABLED", "False") == "True"
