from rest_framework import serializers

from apps.users.models import User
from core.models import Location
from core.serializers import LocationSerializer
from core.constants import OWNER_ROLE, TENANT_ROLE


class FirebaseLoginSerializer(serializers.Serializer):
    firebase_token = serializers.CharField()
    role = serializers.ChoiceField(choices=[OWNER_ROLE, TENANT_ROLE], required=False)
    remember_me = serializers.BooleanField(required=False, default=False)


class EmailOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=4, max_length=8)
    role = serializers.ChoiceField(choices=[OWNER_ROLE, TENANT_ROLE], required=False)
    remember_me = serializers.BooleanField(required=False, default=False)


class UserProfileSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "role",
            "location",
            "location_id",
            "is_verified",
            "date_joined",
            "firebase_uid",
        ]
        read_only_fields = ["id", "is_verified", "date_joined", "firebase_uid"]


class UserProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=15)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    role = serializers.ChoiceField(choices=[OWNER_ROLE, TENANT_ROLE], required=False)
    location_id = serializers.UUIDField(required=False, allow_null=True)
    
    # Location fields
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    country = serializers.CharField(required=False, allow_blank=True, max_length=100)
    pincode = serializers.CharField(required=False, allow_blank=True, max_length=7)
    locality = serializers.CharField(required=False, allow_blank=True, max_length=150)
    lat = serializers.DecimalField(required=False, allow_null=True, max_digits=13, decimal_places=10)
    lng = serializers.DecimalField(required=False, allow_null=True, max_digits=13, decimal_places=10)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field is required")
        return attrs
