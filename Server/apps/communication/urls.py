from django.urls import path

from apps.communication.views import (
    ConversationArchiveAPIView,
    ConversationListCreateAPIView,
    ConversationMarkReadAPIView,
    ConversationMessageListCreateAPIView,
)

urlpatterns = [
    path("communication/conversations/", 
         ConversationListCreateAPIView.as_view(), 
         name="conversation-list-create"),
    path(
        "communication/conversations/<uuid:conversation_id>/messages/",
        ConversationMessageListCreateAPIView.as_view(),
        name="conversation-messages",
    ),
    path(
        "communication/conversations/<uuid:conversation_id>/read/",
        ConversationMarkReadAPIView.as_view(),
        name="conversation-mark-read",
    ),
    path(
        "communication/conversations/<uuid:conversation_id>/archive/",
        ConversationArchiveAPIView.as_view(),
        name="conversation-archive",
    ),
]
