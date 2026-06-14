from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID
import asyncio

from django.conf import settings
from django.core.cache import cache
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.exceptions import ValidationError

from apps.communication.auth import authenticate_from_message
from apps.communication.serializers import MessageSerializer
from apps.communication.services import CommunicationService


class ConversationConsumer(AsyncJsonWebsocketConsumer):
    @staticmethod
    def _channel_safe(value):
        """Convert payload values to msgpack-safe types for channels_redis."""
        if isinstance(value, dict):
            return {str(key): ConversationConsumer._channel_safe(val) for key, val in value.items()}
        if isinstance(value, list):
            return [ConversationConsumer._channel_safe(item) for item in value]
        if isinstance(value, tuple):
            return [ConversationConsumer._channel_safe(item) for item in value]
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, (datetime, date, time)):
            return value.isoformat()
        if isinstance(value, Decimal):
            return float(value)
        return value

    async def connect(self):
        await self.accept()
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            self._authenticated = False
            asyncio.ensure_future(self._auth_timeout())
            return

        await self._setup_conversation(user)

    async def _auth_timeout(self):
        """Close the connection if authentication is not completed in time."""
        await asyncio.sleep(10)
        if not getattr(self, "_authenticated", False):
            try:
                await self.close(code=4401)
            except RuntimeError:
                pass

    async def _setup_conversation(self, user):
        conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        try:
            self.conversation = await database_sync_to_async(
                CommunicationService.get_conversation_for_user
            )(conversation_id, user)
        except Exception:
            await self.close(code=4403)
            return

        self.group_name = f"conversation_{self.conversation.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        self._authenticated = True

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(code)

    async def receive_json(self, content, **kwargs):
        action = content.get("action", "send_message")

        # Handle first-message authentication (TASK-18B)
        if action == "authenticate":
            if getattr(self, "_authenticated", True):
                return  # already authenticated, ignore
            success = await authenticate_from_message(self.scope, content.get("token", ""))
            if not success:
                await self.close(code=4401)
                return
            await self._setup_conversation(self.scope["user"])
            return

        # Reject any action from an unauthenticated connection
        if not getattr(self, "_authenticated", True):
            await self.close(code=4401)
            return
        if action == "send_message":
            await self._handle_send_message(content)
            return

        if action == "mark_read":
            updated = await database_sync_to_async(CommunicationService.mark_read)(
                self.conversation,
                self.scope["user"],
            )
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.read",
                    "updated": updated,
                    "user_id": str(self.scope["user"].id),
                },
            )
            return

        if action == "typing":
            await self._handle_typing_update(content)
            return

        await self.send_json({"type": "error", "detail": "Unsupported action"})

    async def _handle_send_message(self, payload):
        allowed = await database_sync_to_async(self._allow_send_message_for_user)()
        if not allowed:
            await self.send_json(
                {
                    "type": "error",
                    "code": "rate_limited",
                    "detail": "You are sending messages too quickly. Please wait and try again.",
                }
            )
            return

        try:
            message = await database_sync_to_async(CommunicationService.send_text_message)(
                conversation=self.conversation,
                sender=self.scope["user"],
                content=payload.get("content"),
                image=None,
                client_id=payload.get("client_id"),
            )
            data = await database_sync_to_async(lambda: MessageSerializer(message).data)()
            data = self._channel_safe(data)
        except ValidationError as exc:
            await self.send_json({"type": "error", "detail": exc.detail})
            return
        except Exception:
            await self.send_json({"type": "error", "detail": "Unable to send message"})
            return

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "chat.message", "message": data},
        )

    async def _handle_typing_update(self, payload):
        is_typing = bool(payload.get("is_typing", False))
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.typing",
                "user_id": str(self.scope["user"].id),
                "is_typing": is_typing,
            },
        )

    def _allow_send_message_for_user(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            return False

        burst_limit = getattr(settings, "CHAT_WS_BURST_LIMIT_PER_SEC", 3)
        minute_limit = getattr(settings, "CHAT_WS_SUSTAINED_LIMIT_PER_MIN", 10)

        per_second_key = f"chat:ws:rate:{user.id}:{self.conversation.id}:s"
        per_minute_key = f"chat:ws:rate:{user.id}:{self.conversation.id}:m"

        second_count = cache.get(per_second_key)
        if second_count is None:
            cache.set(per_second_key, 1, timeout=1)
            second_count = 1
        else:
            try:
                second_count = cache.incr(per_second_key)
            except ValueError:
                cache.set(per_second_key, 1, timeout=1)
                second_count = 1

        minute_count = cache.get(per_minute_key)
        if minute_count is None:
            cache.set(per_minute_key, 1, timeout=60)
            minute_count = 1
        else:
            try:
                minute_count = cache.incr(per_minute_key)
            except ValueError:
                cache.set(per_minute_key, 1, timeout=60)
                minute_count = 1

        return second_count <= burst_limit and minute_count <= minute_limit

    async def chat_message(self, event):
        await self.send_json({"type": "message.created", "message": event["message"]})

    async def chat_typing(self, event):
        await self.send_json(
            {
                "type": "typing.updated",
                "user_id": event["user_id"],
                "is_typing": event["is_typing"],
            }
        )

    async def chat_read(self, event):
        await self.send_json(
            {
                "type": "read.updated",
            }
        )

class UserConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            self._authenticated = False
            asyncio.ensure_future(self._auth_timeout())
            return
            
        await self._setup_user(user)

    async def _auth_timeout(self):
        await asyncio.sleep(10)
        if not getattr(self, "_authenticated", False):
            await self.close(code=4401)

    async def _setup_user(self, user):
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        self._authenticated = True

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await super().disconnect(code)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action == "authenticate":
            if getattr(self, "_authenticated", True):
                return
            success = await authenticate_from_message(self.scope, content.get("token", ""))
            if not success:
                await self.close(code=4401)
                return
            await self._setup_user(self.scope["user"])
            return

    async def chat_conversation_updated(self, event):
        await self.send_json(
            {
                "type": "conversation.updated",
                "conversation": event["conversation"],
            }
        )
