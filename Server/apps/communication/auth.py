import asyncio
import logging

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

# Timeout (seconds) to receive the authenticate message after WS connect.
WS_AUTH_TIMEOUT = 10


@database_sync_to_async
def _get_user_from_token(raw_token):
    try:
        auth = JWTAuthentication()
        validated_token = auth.get_validated_token(raw_token)
        return auth.get_user(validated_token)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Authenticates WebSocket connections via the Authorization header only.
    """

    async def __call__(self, scope, receive, send):
        raw_token = None

        # Authorization header only — no query-param token (TASK-18B)
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization", b"").decode("utf-8")
        if auth_header.startswith("Bearer "):
            raw_token = auth_header.split(" ", 1)[1].strip()

        scope["user"] = await _get_user_from_token(raw_token) if raw_token else AnonymousUser()
        return await super().__call__(scope, receive, send)


async def authenticate_from_message(scope, raw_token: str) -> bool:
    """
    Validate a JWT token received in the first WebSocket message and
    update scope['user'] in-place.  Returns True on success.

    Used by ConversationConsumer to handle { action: 'authenticate', token }.
    """
    if not raw_token or not isinstance(raw_token, str):
        return False
    user = await _get_user_from_token(raw_token.strip())
    if user and user.is_authenticated:
        scope["user"] = user
        return True
    return False
