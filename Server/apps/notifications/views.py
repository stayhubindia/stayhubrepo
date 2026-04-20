from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.selectors import get_unread_count, get_user_notifications
from apps.notifications.serializers import NotificationSerializer
from apps.notifications.services import NotificationService


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        unread_only = self.request.query_params.get("unread") == "true"
        return get_user_notifications(self.request.user, unread_only=unread_only)


class NotificationMarkReadAPIView(APIView):
    def post(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id)
        notification = NotificationService.mark_as_read(notification, request.user)
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class NotificationMarkAllReadAPIView(APIView):
    def post(self, request):
        updated = NotificationService.mark_all_as_read(request.user)
        return Response({"updated": updated}, status=status.HTTP_200_OK)


class NotificationUnreadCountAPIView(APIView):
    def get(self, request):
        return Response({"unread_count": get_unread_count(request.user)}, status=status.HTTP_200_OK)
