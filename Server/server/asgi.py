import os

from django.conf import settings
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

django_asgi_app = get_asgi_application()

from apps.communication.auth import JWTAuthMiddleware
from apps.communication.routing import websocket_urlpatterns

websocket_application = JWTAuthMiddleware(
    URLRouter(websocket_urlpatterns),
)

# We do not use Origin validation because mobile clients (Flutter)
# often do not send standard Origin headers and we rely on JWT authentication.
# websocket_application is passed directly to the router.

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": websocket_application,
    }
)
