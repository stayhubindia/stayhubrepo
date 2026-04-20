from rest_framework import serializers

from apps.analytics.models import LocationHeatmap, OwnerDashboardSnapshot, PropertyDailyAggregate


class PropertyDailyAggregateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyDailyAggregate
        fields = ["id", "property", "date", "views", "favorites", "contacts", "created_at"]
        read_only_fields = fields


class OwnerDashboardSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = OwnerDashboardSnapshot
        fields = ["id", "owner", "date", "total_views", "total_favorites", "total_contacts", "created_at"]
        read_only_fields = fields


class LocationHeatmapSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()

    def get_location(self, obj):
        loc = obj.location
        return {
            "id": loc.id,
            "city": loc.city,
            "state": loc.state,
            "country": loc.country,
            "locality": loc.locality,
            "pincode": loc.pincode,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
        }

    class Meta:
        model = LocationHeatmap
        fields = ["id", "location", "date", "views", "favorites", "contacts", "created_at"]
        read_only_fields = fields
