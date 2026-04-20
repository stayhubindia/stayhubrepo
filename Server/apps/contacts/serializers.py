from rest_framework import serializers

from apps.contacts.models import ContactLog


class ContactCreateSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()
    contact_type = serializers.ChoiceField(choices=ContactLog.CONTACT_TYPE_CHOICES, default="PHONE")
    message = serializers.CharField(required=False, allow_blank=True)


class ContactLogSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    tenant_name = serializers.CharField(source="tenant.first_name", read_only=True)

    class Meta:
        model = ContactLog
        fields = [
            "id",
            "property",
            "property_title",
            "tenant",
            "tenant_name",
            "contact_type",
            "message",
            "ip_address",
            "created_at",
        ]
