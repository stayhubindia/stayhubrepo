from rest_framework import serializers

from apps.communication.models import Conversation, Message
from apps.users.serializers import UserProfileSerializer


class ConversationPropertySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(read_only=True)


class ConversationCreateSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()


class MessageSendSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)


class MessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "message_type",
            "content",
            "image",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    property = ConversationPropertySerializer(read_only=True)
    tenant = UserProfileSerializer(read_only=True)
    owner = UserProfileSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "property",
            "tenant",
            "owner",
            "status",
            "message_count",
            "owner_unread_count",
            "tenant_unread_count",
            "last_message_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
