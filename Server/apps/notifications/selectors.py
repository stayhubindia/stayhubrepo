from apps.notifications.models import Notification


def get_user_notifications(user, unread_only=False):
    queryset = Notification.objects.filter(recipient=user)
    if unread_only:
        queryset = queryset.filter(is_read=False)
    return queryset.order_by("-created_at")


def get_unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()
