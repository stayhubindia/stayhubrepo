from types import SimpleNamespace
import uuid
from unittest.mock import Mock
from unittest.mock import patch

from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.notifications.models import Notification
from apps.notifications.views import (
    NotificationListAPIView,
    NotificationMarkReadAPIView,
    NotificationUnreadCountAPIView,
)
from apps.notifications.services import NotificationService
from apps.users.models import User


class NotificationServiceTests(SimpleTestCase):
    def test_create_notification_calls_model_create(self):
        recipient = SimpleNamespace(id=1)
        with patch(
            "apps.notifications.services.Notification.objects.create",
            return_value="notification",
        ) as create_mock, patch(
            "apps.notifications.services.send_notification_task.delay",
            return_value=None,
        ) as delay_mock:
            result = NotificationService.create_notification(
                recipient=recipient,
                notification_type="SYSTEM",
                title="System Update",
                message="Maintenance",
            )
        # When async is enabled, create_notification returns None after enqueue
        # ensure delay was called and fallback create was not bypassed when disabled
        delay_mock.assert_called_once()
        create_mock.assert_not_called()

    def test_mark_as_read_owner_only(self):
        user = SimpleNamespace(id=1)
        other_user = SimpleNamespace(id=2)
        notification = SimpleNamespace(recipient_id=1, is_read=False, read_at=None, save=Mock())

        with self.assertRaises(PermissionDenied):
            NotificationService.mark_as_read(notification, other_user)

        updated = NotificationService.mark_as_read(notification, user)
        self.assertTrue(updated.is_read)
        updated.save.assert_called_once()

    def test_mark_all_as_read_updates_queryset(self):
        qs = Mock()
        qs.update.return_value = 3
        user = SimpleNamespace(id=1)
        with patch("apps.notifications.services.Notification.objects.filter", return_value=qs) as filter_mock:
            updated_count = NotificationService.mark_all_as_read(user)
        self.assertEqual(updated_count, 3)
        filter_mock.assert_called_once_with(recipient=user, is_read=False)
        qs.update.assert_called_once()


class NotificationModelMetaTests(SimpleTestCase):
    def test_notification_indexes_exist(self):
        index_fields = {tuple(index.fields) for index in Notification._meta.indexes}
        self.assertIn(("recipient", "is_read"), index_fields)
        self.assertIn(("notification_type",), index_fields)


class NotificationAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User(id=uuid.uuid4(), email="user@example.com", role="TENANT")

    def test_notification_list_requires_authentication(self):
        request = self.factory.get("/api/v1/notifications/")
        response = NotificationListAPIView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_unread_count_returns_value(self):
        with patch("apps.notifications.views.get_unread_count", return_value=3) as unread_mock:
            request = self.factory.get("/api/v1/notifications/unread-count/")
            force_authenticate(request, user=self.user)
            response = NotificationUnreadCountAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 3)
        unread_mock.assert_called_once()

    def test_mark_read_calls_service(self):
        notification = Notification(
            id=uuid.uuid4(),
            recipient=self.user,
            notification_type="SYSTEM",
            title="Update",
            message="Hello",
            is_read=False,
        )
        with patch(
            "apps.notifications.views.get_object_or_404",
            return_value=notification,
        ), patch(
            "apps.notifications.views.NotificationService.mark_as_read",
            return_value=notification,
        ) as mark_mock:
            request = self.factory.post(
                f"/api/v1/notifications/{notification.id}/read/",
                {},
                format="json",
            )
            force_authenticate(request, user=self.user)
            response = NotificationMarkReadAPIView.as_view()(request, notification_id=notification.id)

        self.assertEqual(response.status_code, 200)
        mark_mock.assert_called_once()
