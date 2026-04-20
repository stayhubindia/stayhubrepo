from django.core.exceptions import PermissionDenied
from django.utils import timezone

from django.conf import settings

from apps.notifications.models import Notification
from apps.notifications.tasks import send_notification_task


class NotificationService:
    @staticmethod
    def create_notification(recipient, notification_type, title, message, reference_id=None):
        if getattr(settings, "USE_ASYNC_NOTIFICATIONS", False) and hasattr(send_notification_task, "delay"):
            send_notification_task.delay(str(recipient.id), notification_type, title, message, reference_id)
            return None

        return Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id,
        )

    @staticmethod
    def mark_as_read(notification, user):
        if notification.recipient_id != user.id:
            raise PermissionDenied("You cannot mark this notification")

        if notification.is_read:
            return notification

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])
        return notification

    @staticmethod
    def mark_all_as_read(user):
        return Notification.objects.filter(recipient=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )
