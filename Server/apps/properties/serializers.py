from rest_framework import serializers

from apps.properties.models import Amenity, Property, PropertyImage
from core.models import Location
from core.serializers import LocationSerializer


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name", "icon"]


class PropertyListSerializer(serializers.ModelSerializer):
    country = serializers.CharField(source="location.country", read_only=True, allow_null=True)
    state = serializers.CharField(source="location.state", read_only=True, allow_null=True)
    city = serializers.CharField(source="location.city", read_only=True, allow_null=True)
    locality = serializers.CharField(source="location.locality", read_only=True, allow_null=True)
    pincode = serializers.CharField(source="location.pincode", read_only=True, allow_null=True)
    address = serializers.CharField(source="location.address", read_only=True, allow_null=True)
    latitude = serializers.DecimalField(source="location.latitude", read_only=True, allow_null=True, max_digits=13, decimal_places=10)
    longitude = serializers.DecimalField(source="location.longitude", read_only=True, allow_null=True, max_digits=13, decimal_places=10)
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        images = sorted(obj.images.all(), key=lambda image: (not image.is_primary, image.order, image.created_at))
        return PropertyImageSerializer(images, many=True).data

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "property_type",
            "furnishing",
            "rent",
            "country",
            "state",
            "city",
            "locality",
            "pincode",
            "address",
            "latitude",
            "longitude",
            "status",
            "is_featured",
            "total_views",
            "total_favorites",
            "total_contacts",
            "available_from",
            "images",
            "created_at",
        ]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "is_primary", "order", "created_at"]


class PropertyImageUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    is_primary = serializers.BooleanField(required=False, default=False)
    order = serializers.IntegerField(required=False, min_value=0)


class PropertySerializer(serializers.ModelSerializer):
    amenities = AmenitySerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    location = LocationSerializer(read_only=True)
    location_id = serializers.UUIDField(required=False, write_only=True)
    address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100, write_only=True)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100, write_only=True)
    country = serializers.CharField(required=False, allow_blank=True, max_length=100, write_only=True)
    pincode = serializers.CharField(required=False, allow_blank=True, max_length=7, write_only=True)
    locality = serializers.CharField(required=False, allow_blank=True, max_length=150, write_only=True)
    lat = serializers.DecimalField(required=False, allow_null=True, max_digits=13, decimal_places=10, write_only=True)
    lng = serializers.DecimalField(required=False, allow_null=True, max_digits=13, decimal_places=10, write_only=True)
    amenity_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Amenity.objects.all(),
        required=False,
        write_only=True,
    )

    def get_location(self, obj):
        loc = getattr(obj, "location", None)
        if not loc:
            return None
        return {
            "id": loc.id,
            "country": loc.country,
            "state": loc.state,
            "city": loc.city,
            "locality": loc.locality,
            "pincode": loc.pincode,
            "address": loc.address,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
        }

    class Meta:
        model = Property
        fields = [
            "id",
            "owner",
            "title",
            "description",
            "property_type",
            "furnishing",
            "rent",
            "deposit",
            "bedrooms",
            "bathrooms",
            "area_sqft",
            "total_favorites",
            "available_from",
            "location",
            "location_id",
            "address",
            "city",
            "state",
            "country",
            "pincode",
            "locality",
            "lat",
            "lng",
            "preferred_tenant",
            "total_views",
            "total_contacts",
            "status",
            "is_featured",
            "featured_until",
            "amenities",
            "images",
            "amenity_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "status",
            "total_views",
            "total_contacts",
            "total_favorites",
            "is_featured",
            "featured_until",
            "amenities",
            "location",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        rent = attrs.get("rent")
        if rent is not None and rent <= 0:
            raise serializers.ValidationError("Rent must be positive")
        location_fields = {"address", "city", "state", "country", "pincode", "locality", "lat", "lng"}
        if self.instance is None and "location_id" not in attrs and not any(field in attrs for field in location_fields):
            raise serializers.ValidationError("Provide location_id or location details")
        return attrs
