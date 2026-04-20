from django.urls import path

from apps.notifications.views import (
    NotificationListAPIView,
    NotificationMarkAllReadAPIView,
    NotificationMarkReadAPIView,
    NotificationUnreadCountAPIView,
)

urlpatterns = [
    path("notifications/", NotificationListAPIView.as_view(), name="notifications-list"),
    path("notifications/<uuid:notification_id>/read/", NotificationMarkReadAPIView.as_view(), name="notifications-mark-read"),
    path("notifications/mark-all-read/", NotificationMarkAllReadAPIView.as_view(), name="notifications-mark-all-read"),
    path("notifications/unread-count/", NotificationUnreadCountAPIView.as_view(), name="notifications-unread-count"),
]
