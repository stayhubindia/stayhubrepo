import uuid
from datetime import datetime, timezone as dt_timezone
import importlib.util
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from django.test.utils import override_settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.communication.models import Conversation, Message
from apps.communication.services import CommunicationService
from apps.communication.views import (
    ConversationListCreateAPIView,
    ConversationMarkReadAPIView,
    ConversationMessageListCreateAPIView,
)
from apps.properties.models import Property
from apps.users.models import User
from core.models import Location

HAS_CHANNELS = bool(importlib.util.find_spec("channels"))
if HAS_CHANNELS:
    from apps.communication.consumers import ConversationConsumer


class CommunicationModelMetaTests(SimpleTestCase):
    def test_conversation_constraints_exist(self):
        constraint_names = {constraint.name for constraint in Conversation._meta.constraints}
        self.assertIn("unique_conversation_per_property_tenant", constraint_names)
        self.assertIn("conversation_tenant_owner_must_differ", constraint_names)

    def test_message_indexes_exist(self):
        index_fields = {tuple(index.fields) for index in Message._meta.indexes}
        self.assertIn(("conversation", "created_at"), index_fields)
        self.assertIn(("conversation", "is_read"), index_fields)

    def test_message_constraints_exist(self):
        constraint_names = {constraint.name for constraint in Message._meta.constraints}
        self.assertIn("message_content_or_image_required", constraint_names)


class CommunicationServiceTests(SimpleTestCase):
    def test_create_conversation_requires_tenant_role(self):
        actor = SimpleNamespace(role="OWNER")
        with self.assertRaises(PermissionDenied):
            CommunicationService.get_or_create_conversation_for_tenant.__wrapped__(
                actor,
                uuid.uuid4(),
            )

    def test_create_conversation_rejects_inactive_property(self):
        actor = SimpleNamespace(id=uuid.uuid4(), role="TENANT")
        owner = SimpleNamespace(id=uuid.uuid4())
        property_obj = SimpleNamespace(
            id=uuid.uuid4(),
            owner=owner,
            owner_id=owner.id,
            status="DRAFT",
        )
        filter_qs = Mock()
        filter_qs.first.return_value = property_obj
        select_qs = Mock()
        select_qs.filter.return_value = filter_qs

        with patch("apps.communication.services.Property.objects.select_related", return_value=select_qs):
            with self.assertRaises(PermissionDenied):
                CommunicationService.get_or_create_conversation_for_tenant.__wrapped__(
                    actor,
                    property_obj.id,
                )

    def test_create_conversation_success(self):
        actor = SimpleNamespace(id=uuid.uuid4(), role="TENANT")
        owner = SimpleNamespace(id=uuid.uuid4())
        property_obj = SimpleNamespace(
            id=uuid.uuid4(),
            owner=owner,
            owner_id=owner.id,
            status="ACTIVE",
        )
        conversation = SimpleNamespace(owner_id=owner.id, status="ACTIVE")
        filter_qs = Mock()
        filter_qs.first.return_value = property_obj
        select_qs = Mock()
        select_qs.filter.return_value = filter_qs

        with patch("apps.communication.services.Property.objects.select_related", return_value=select_qs), patch(
            "apps.communication.services.Conversation.objects.get_or_create",
            return_value=(conversation, True),
        ) as create_mock:
            result_conversation, created = CommunicationService.get_or_create_conversation_for_tenant.__wrapped__(
                actor,
                property_obj.id,
            )

        self.assertEqual(result_conversation, conversation)
        self.assertTrue(created)
        create_mock.assert_called_once()

    def test_send_text_message_requires_participant(self):
        conversation = SimpleNamespace(
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            property=SimpleNamespace(status="ACTIVE"),
            status="ACTIVE",
        )
        sender = SimpleNamespace(id=uuid.uuid4())
        with self.assertRaises(PermissionDenied):
            CommunicationService.send_text_message.__wrapped__(conversation, sender, "hello")

    def test_send_text_message_updates_and_notifies(self):
        now = timezone.now()
        tenant = SimpleNamespace(id=uuid.uuid4())
        owner = SimpleNamespace(id=uuid.uuid4())
        conversation = SimpleNamespace(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            owner_id=owner.id,
            tenant=tenant,
            owner=owner,
            property=SimpleNamespace(status="ACTIVE"),
            status="ACTIVE",
            refresh_from_db=Mock(),
        )
        message = SimpleNamespace(created_at=now)
        filter_qs = Mock()

        with patch("apps.communication.services.Message.objects.create", return_value=message) as create_mock, patch(
            "apps.communication.services.Conversation.objects.filter",
            return_value=filter_qs,
        ) as conv_filter_mock, patch(
            "apps.communication.services.NotificationService.create_notification"
        ) as notify_mock:
            result = CommunicationService.send_text_message.__wrapped__(
                conversation=conversation,
                sender=tenant,
                content="Hello owner",
                image=None,
            )

        self.assertEqual(result, message)
        create_mock.assert_called_once()
        conv_filter_mock.assert_called_once_with(id=conversation.id)
        filter_qs.update.assert_called_once()
        notify_mock.assert_called_once()

    def test_mark_read_resets_unread_counter(self):
        tenant = SimpleNamespace(id=uuid.uuid4())
        owner = SimpleNamespace(id=uuid.uuid4())
        conversation = SimpleNamespace(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            owner_id=owner.id,
            refresh_from_db=Mock(),
        )

        message_filter_qs = Mock()
        exclude_qs = Mock()
        message_filter_qs.exclude.return_value = exclude_qs
        exclude_qs.update.return_value = 4

        conversation_filter_qs = Mock()

        with patch(
            "apps.communication.services.Message.objects.filter",
            return_value=message_filter_qs,
        ), patch(
            "apps.communication.services.Conversation.objects.filter",
            return_value=conversation_filter_qs,
        ):
            updated = CommunicationService.mark_read.__wrapped__(conversation, tenant)

        self.assertEqual(updated, 4)
        conversation_filter_qs.update.assert_called_once_with(tenant_unread_count=0)


class CommunicationAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.owner = User(id=uuid.uuid4(), email="owner@example.com", role="OWNER")
        self.tenant = User(id=uuid.uuid4(), email="tenant@example.com", role="TENANT")
        self.location = Location(
            country="India",
            state="Karnataka",
            city="Bengaluru",
            locality="HSR",
            pincode="560102",
            address="Road 12",
        )
        self.property_obj = Property(
            id=uuid.uuid4(),
            owner=self.owner,
            title="2BHK",
            description="Near station",
            property_type="2BHK",
            furnishing="SEMI",
            rent=20000,
            location=self.location,
            status="ACTIVE",
        )
        self.conversation = Conversation(
            id=uuid.uuid4(),
            property=self.property_obj,
            tenant=self.tenant,
            owner=self.owner,
            status="ACTIVE",
        )
        self.message = Message(
            id=uuid.uuid4(),
            conversation=self.conversation,
            sender=self.tenant,
            message_type="TEXT",
            content="Hello",
            is_read=False,
            created_at=datetime.now(tz=dt_timezone.utc),
        )

    def test_conversation_list_requires_authentication(self):
        request = self.factory.get("/api/v1/communication/conversations/")
        response = ConversationListCreateAPIView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_conversation_create_calls_service(self):
        with patch(
            "apps.communication.views.CommunicationService.get_or_create_conversation_for_tenant",
            return_value=(self.conversation, True),
        ) as create_mock:
            request = self.factory.post(
                "/api/v1/communication/conversations/",
                {"property_id": str(self.property_obj.id)},
                format="json",
            )
            force_authenticate(request, user=self.tenant)
            response = ConversationListCreateAPIView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        create_mock.assert_called_once()

    def test_message_create_calls_service(self):
        with patch(
            "apps.communication.views.CommunicationService.get_conversation_for_user",
            return_value=self.conversation,
        ), patch(
            "apps.communication.views.CommunicationService.send_text_message",
            return_value=self.message,
        ) as send_service_mock, patch(
            "apps.communication.views.MessageSerializer",
        ) as message_serializer_mock:
            message_serializer_mock.return_value.data = {"id": str(self.message.id), "content": "Hello owner"}
            request = self.factory.post(
                f"/api/v1/communication/conversations/{self.conversation.id}/messages/",
                {"content": "Hello owner"},
                format="json",
            )
            force_authenticate(request, user=self.tenant)
            response = ConversationMessageListCreateAPIView.as_view()(
                request,
                conversation_id=self.conversation.id,
            )

        self.assertEqual(response.status_code, 201)
        send_service_mock.assert_called_once()

    def test_mark_read_calls_service(self):
        with patch(
            "apps.communication.views.CommunicationService.get_conversation_for_user",
            return_value=self.conversation,
        ), patch(
            "apps.communication.views.CommunicationService.mark_read",
            return_value=2,
        ) as read_mock:
            request = self.factory.post(
                f"/api/v1/communication/conversations/{self.conversation.id}/read/",
                {},
                format="json",
            )
            force_authenticate(request, user=self.owner)
            response = ConversationMarkReadAPIView.as_view()(request, conversation_id=self.conversation.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 2)
        read_mock.assert_called_once()


if HAS_CHANNELS:
    class CommunicationConsumerTests(SimpleTestCase):
        async def test_connect_rejects_unauthenticated_user(self):
            consumer = ConversationConsumer()
            consumer.scope = {
                "user": AnonymousUser(),
                "url_route": {"kwargs": {"conversation_id": str(uuid.uuid4())}},
            }
            consumer.accept = AsyncMock()
            consumer.close = AsyncMock()

            with patch("apps.communication.consumers.asyncio.ensure_future") as ensure_future_mock:
                await consumer.connect()
                scheduled = ensure_future_mock.call_args[0][0]
                scheduled.close()

            consumer.accept.assert_awaited_once()
            ensure_future_mock.assert_called_once()
            consumer.close.assert_not_called()

        async def test_receive_invalid_action_returns_error(self):
            user = SimpleNamespace(id=uuid.uuid4(), is_authenticated=True)
            consumer = ConversationConsumer()
            consumer.scope = {"user": user}
            consumer.conversation = SimpleNamespace()
            consumer.send_json = AsyncMock()

            await consumer.receive_json({"action": "invalid"})
            consumer.send_json.assert_awaited_once()

        async def test_receive_typing_action_broadcasts_group_event(self):
            user = SimpleNamespace(id=uuid.uuid4(), is_authenticated=True)
            consumer = ConversationConsumer()
            consumer.scope = {"user": user}
            consumer.conversation = SimpleNamespace(id=uuid.uuid4())
            consumer.group_name = f"conversation_{consumer.conversation.id}"
            consumer.channel_layer = SimpleNamespace(group_send=AsyncMock())

            await consumer.receive_json({"action": "typing", "is_typing": True})

            consumer.channel_layer.group_send.assert_awaited_once_with(
                consumer.group_name,
                {
                    "type": "chat.typing",
                    "user_id": str(user.id),
                    "is_typing": True,
                },
            )

        async def test_receive_mark_read_broadcasts_group_event(self):
            user = SimpleNamespace(id=uuid.uuid4(), is_authenticated=True)
            consumer = ConversationConsumer()
            consumer.scope = {"user": user}
            consumer.conversation = SimpleNamespace(id=uuid.uuid4())
            consumer.group_name = f"conversation_{consumer.conversation.id}"
            consumer.channel_layer = SimpleNamespace(group_send=AsyncMock())

            with patch("apps.communication.consumers.CommunicationService.mark_read", return_value=3):
                await consumer.receive_json({"action": "mark_read"})

            consumer.channel_layer.group_send.assert_awaited_once_with(
                consumer.group_name,
                {
                    "type": "chat.read",
                    "updated": 3,
                    "user_id": str(user.id),
                },
            )

        @override_settings(CHAT_WS_BURST_LIMIT_PER_SEC=1, CHAT_WS_SUSTAINED_LIMIT_PER_MIN=10)
        def test_message_rate_limit_blocks_after_burst_threshold(self):
            user = SimpleNamespace(id=uuid.uuid4(), is_authenticated=True)
            conversation = SimpleNamespace(id=uuid.uuid4())
            consumer = ConversationConsumer()
            consumer.scope = {"user": user}
            consumer.conversation = conversation

            per_second_key = f"chat:ws:rate:{user.id}:{conversation.id}:s"
            per_minute_key = f"chat:ws:rate:{user.id}:{conversation.id}:m"
            cache.delete(per_second_key)
            cache.delete(per_minute_key)

            self.assertTrue(consumer._allow_send_message_for_user())
            self.assertFalse(consumer._allow_send_message_for_user())
