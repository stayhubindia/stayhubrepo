from rest_framework import serializers

from apps.favorites.models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    property_id = serializers.UUIDField(source="property.id", read_only=True)
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_city = serializers.CharField(source="property.location.city", read_only=True, allow_null=True)
    property_rent = serializers.DecimalField(source="property.rent", read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = Favorite
        fields = ["id", "property_id", "property_title", "property_city", "property_rent", "created_at"]


class FavoriteCreateSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()
