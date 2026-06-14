from rest_framework import serializers

from apps.contacts.models import ContactLog, TourRequest


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

class TourRequestCreateSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()
    tour_date = serializers.DateField()
    tour_time = serializers.CharField(max_length=20)
    message = serializers.CharField(required=False, allow_blank=True)


class TourRequestSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    tenant_name = serializers.CharField(source="tenant.first_name", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone_number", read_only=True)

    class Meta:
        model = TourRequest
        fields = [
            "id",
            "property",
            "property_title",
            "tenant",
            "tenant_name",
            "tenant_phone",
            "tour_date",
            "tour_time",
            "status",
            "message",
            "created_at",
        ]
        read_only_fields = ["status"]
