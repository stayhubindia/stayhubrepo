from django.core.exceptions import PermissionDenied
from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.communication.models import Conversation, Message
from apps.notifications.services import NotificationService
from apps.properties.models import Property
from core.constants import (
    CONVERSATION_STATUS_ACTIVE,
    CONVERSATION_STATUS_ARCHIVED,
    MESSAGE_TYPE_IMAGE,
    MESSAGE_TYPE_TEXT,
    NOTIFICATION_NEW_MESSAGE,
    OWNER_ROLE,
    PROPERTY_STATUS_ACTIVE,
    TENANT_ROLE,
)
from core.services import ServiceGuards


class CommunicationService:
    @staticmethod
    def _ensure_participant(conversation, actor):
        if actor.id not in {conversation.tenant_id, conversation.owner_id} and not getattr(actor, "is_staff", False):
            raise PermissionDenied("You are not a participant of this conversation")

    @staticmethod
    def _ensure_property_active(property_obj):
        if property_obj.status != PROPERTY_STATUS_ACTIVE:
            raise PermissionDenied("Messaging is available only for active properties")

    @staticmethod
    def list_conversations(actor):
        return Conversation.objects.filter(
            models.Q(tenant=actor) | models.Q(owner=actor)
        ).select_related("property", "tenant", "tenant__location", "owner", "owner__location")

    @staticmethod
    @transaction.atomic
    def get_or_create_conversation_for_tenant(actor, property_id):
        ServiceGuards.ensure_role(actor, {TENANT_ROLE}, "Only tenants can start a conversation")

        property_obj = Property.objects.select_related("owner").filter(id=property_id).first()
        if property_obj is None:
            raise ValidationError("Property not found")

        CommunicationService._ensure_property_active(property_obj)
        if property_obj.owner_id == actor.id:
            raise PermissionDenied("Owners cannot start conversation on their own property")

        conversation, created = Conversation.objects.get_or_create(
            property=property_obj,
            tenant=actor,
            defaults={
                "owner": property_obj.owner,
                "status": CONVERSATION_STATUS_ACTIVE,
            },
        )

        fields_to_update = []
        if conversation.owner_id != property_obj.owner_id:
            conversation.owner = property_obj.owner
            fields_to_update.append("owner")
        if conversation.status == CONVERSATION_STATUS_ARCHIVED:
            conversation.status = CONVERSATION_STATUS_ACTIVE
            fields_to_update.append("status")

        if fields_to_update:
            conversation.save(update_fields=fields_to_update)

        return conversation, created

    @staticmethod
    def get_conversation_for_user(conversation_id, actor):
        conversation = Conversation.objects.select_related("property", "tenant", "owner").filter(
            id=conversation_id
        ).first()
        if conversation is None:
            raise ValidationError("Conversation not found")

        CommunicationService._ensure_participant(conversation, actor)
        return conversation

    @staticmethod
    def list_messages(conversation, actor):
        CommunicationService._ensure_participant(conversation, actor)
        return Message.objects.filter(conversation=conversation).select_related("sender", "sender__location")

    @staticmethod
    @transaction.atomic
    def send_text_message(conversation, sender, content, image=None):
        CommunicationService._ensure_participant(conversation, sender)
        CommunicationService._ensure_property_active(conversation.property)

        if conversation.status != CONVERSATION_STATUS_ACTIVE:
            raise PermissionDenied("Only active conversations accept new messages")

        cleaned_content = (content or "").strip()
        if not cleaned_content and image is None:
            raise ValidationError("Message content is required")

        recipient = conversation.owner if sender.id == conversation.tenant_id else conversation.tenant

        message_type = MESSAGE_TYPE_IMAGE if image is not None and not cleaned_content else MESSAGE_TYPE_TEXT
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            message_type=message_type,
            content=cleaned_content,
            image=image,
            is_read=False,
        )

        unread_field = "owner_unread_count" if recipient.id == conversation.owner_id else "tenant_unread_count"
        Conversation.objects.filter(id=conversation.id).update(
            message_count=models.F("message_count") + 1,
            last_message_at=message.created_at,
            status=CONVERSATION_STATUS_ACTIVE,
            **{unread_field: models.F(unread_field) + 1},
        )
        conversation.refresh_from_db(fields=["message_count", "last_message_at", "owner_unread_count", "tenant_unread_count", "status"])

        NotificationService.create_notification(
            recipient=recipient,
            notification_type=NOTIFICATION_NEW_MESSAGE,
            title="New message",
            message="You have a new conversation message.",
            reference_id=conversation.id,
        )
        return message

    @staticmethod
    @transaction.atomic
    def mark_read(conversation, actor):
        CommunicationService._ensure_participant(conversation, actor)
        now = timezone.now()
        updated = Message.objects.filter(
            conversation=conversation,
            is_read=False,
        ).exclude(sender=actor).update(
            is_read=True,
            read_at=now,
        )

        unread_field = "tenant_unread_count" if actor.id == conversation.tenant_id else "owner_unread_count"
        Conversation.objects.filter(id=conversation.id).update(**{unread_field: 0})
        conversation.refresh_from_db(fields=["owner_unread_count", "tenant_unread_count"])
        return updated

    @staticmethod
    @transaction.atomic
    def archive_conversation(conversation, actor):
        CommunicationService._ensure_participant(conversation, actor)
        conversation.status = CONVERSATION_STATUS_ARCHIVED
        conversation.save(update_fields=["status"])
        return conversation

    @staticmethod
    def ensure_owner_can_access_owner_side_conversation(actor):
        ServiceGuards.ensure_role(actor, {OWNER_ROLE}, "Only owners can access this endpoint")
