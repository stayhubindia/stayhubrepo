from rest_framework import serializers

from core.models import Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            "id",
            "country",
            "state",
            "city",
            "locality",
            "pincode",
            "address",
            "latitude",
            "longitude",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
