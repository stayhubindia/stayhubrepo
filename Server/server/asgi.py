import os

from django.conf import settings
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

django_asgi_app = get_asgi_application()

from apps.communication.auth import JWTAuthMiddleware
from apps.communication.routing import websocket_urlpatterns

websocket_application = JWTAuthMiddleware(
    URLRouter(websocket_urlpatterns),
)

if getattr(settings, "CORS_ALLOWED_ORIGINS", None):
    websocket_application = OriginValidator(
        websocket_application,
        settings.CORS_ALLOWED_ORIGINS,
    )
elif not settings.DEBUG:
    websocket_application = AllowedHostsOriginValidator(websocket_application)

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": websocket_application,
    }
)
