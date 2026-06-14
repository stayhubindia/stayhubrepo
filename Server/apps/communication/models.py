from django.db import models
from django.db.models import F, Q

from apps.properties.models import Property
from apps.users.models import User
from core.constants import (
    CONVERSATION_STATUS_ACTIVE,
    CONVERSATION_STATUS_ARCHIVED,
    MESSAGE_TYPE_AUDIO,
    MESSAGE_TYPE_IMAGE,
    MESSAGE_TYPE_SYSTEM,
    MESSAGE_TYPE_TEXT,
)
from core.models import BaseModel

def select_audio_storage():
    from django.conf import settings
    if getattr(settings, 'CLOUDINARY_CLOUD_NAME', None):
        from cloudinary_storage.storage import VideoMediaCloudinaryStorage
        return VideoMediaCloudinaryStorage()
    from django.core.files.storage import FileSystemStorage
    return FileSystemStorage()


class Conversation(BaseModel):
    STATUS_CHOICES = (
        (CONVERSATION_STATUS_ACTIVE, "Active"),
        (CONVERSATION_STATUS_ARCHIVED, "Archived"),
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="conversations",
        db_index=True,
    )
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tenant_conversations",
        db_index=True,
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owner_conversations",
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=CONVERSATION_STATUS_ACTIVE,
        db_index=True,
    )
    message_count = models.PositiveIntegerField(default=0)
    owner_unread_count = models.PositiveIntegerField(default=0)
    tenant_unread_count = models.PositiveIntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "status", "last_message_at"]),
            models.Index(fields=["owner", "status", "last_message_at"]),
            models.Index(fields=["property", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["property", "tenant"],
                name="unique_conversation_per_property_tenant",
            ),
            models.CheckConstraint(
                condition=~Q(tenant=F("owner")),
                name="conversation_tenant_owner_must_differ",
            ),
        ]
        ordering = ["-last_message_at", "-created_at"]

    def __str__(self):
        return f"{self.property_id}::{self.tenant_id}"


class Message(BaseModel):
    MESSAGE_TYPE_CHOICES = (
        (MESSAGE_TYPE_TEXT, "Text"),
        (MESSAGE_TYPE_IMAGE, "Image"),
        (MESSAGE_TYPE_SYSTEM, "System"),
        (MESSAGE_TYPE_AUDIO, "Audio"),
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_index=True,
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        db_index=True,
    )
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        default=MESSAGE_TYPE_TEXT,
        db_index=True,
    )
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to="communication/messages/images/", null=True, blank=True)
    audio = models.FileField(upload_to="communication/messages/audio/", storage=select_audio_storage, null=True, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    client_id = models.UUIDField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["conversation", "is_read"]),
            models.Index(fields=["sender", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(content__gt="") | Q(image__isnull=False) | Q(audio__isnull=False),
                name="message_content_or_image_or_audio_required",
            ),
            models.UniqueConstraint(
                fields=["conversation", "client_id"],
                condition=Q(client_id__isnull=False),
                name="unique_message_per_conversation_client_id",
            ),
        ]

    def __str__(self):
        return f"{self.conversation_id}::{self.sender_id}"
