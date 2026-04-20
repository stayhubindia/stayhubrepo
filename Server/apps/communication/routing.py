from django.urls import path

from apps.communication.consumers import ConversationConsumer

websocket_urlpatterns = [
    path(
        "ws/communication/conversations/<uuid:conversation_id>/",
        ConversationConsumer.as_asgi(),
    ),
]
