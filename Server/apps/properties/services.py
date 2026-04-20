from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Max
from django.utils import timezone

from apps.notifications.services import NotificationService
from apps.properties.models import Property, PropertyImage
from apps.properties.tasks import increment_property_views
from core.models import Location
from core.services import ServiceGuards
import logging
from django.core.cache import cache
from core.constants import (
    NOTIFICATION_PROPERTY_APPROVED,
    NOTIFICATION_PROPERTY_REJECTED,
    OWNER_ROLE,
    PROPERTY_STATUS_ACTIVE,
    PROPERTY_STATUS_DRAFT,
    PROPERTY_STATUS_EXPIRED,
    PROPERTY_STATUS_PENDING,
    PROPERTY_STATUS_REJECTED,
    PROPERTY_STATUS_RENTED,
)


class PropertyService:
    logger = logging.getLogger(__name__)

    @staticmethod
    def _extract_location(validated_data):
        location_field_map = {
            "address": "address",
            "city": "city",
            "state": "state",
            "country": "country",
            "pincode": "pincode",
            "locality": "locality",
            "lat": "latitude",
            "lng": "longitude",
        }
        location_data = {}
        for payload_key, model_key in location_field_map.items():
            if payload_key in validated_data:
                location_data[model_key] = validated_data.pop(payload_key)
        return location_data

    @staticmethod
    def _resolve_location(validated_data, current_location=None):
        location_id = validated_data.pop("location_id", None)
        location_data = PropertyService._extract_location(validated_data)

        if location_id is not None:
            location = Location.objects.filter(id=location_id).first()
            if location is None:
                raise ValidationError("Invalid location_id")
            return location

        if location_data:
            if current_location is not None:
                base_data = {
                    "address": current_location.address,
                    "city": current_location.city,
                    "state": current_location.state,
                    "country": current_location.country,
                    "pincode": current_location.pincode,
                    "locality": current_location.locality,
                    "latitude": current_location.latitude,
                    "longitude": current_location.longitude,
                }
                base_data.update(location_data)
                location_data = base_data
            return Location.objects.create(**location_data)

        return current_location

    @staticmethod
    @transaction.atomic
    def create_property(owner, validated_data):
        ServiceGuards.ensure_role(owner, {OWNER_ROLE}, "Only owners can create property")

        amenities = validated_data.pop("amenity_ids", None)
        location = PropertyService._resolve_location(validated_data)
        if location is None:
            raise ValidationError("location_id or location details are required")
        property_obj = Property.objects.create(
            owner=owner,
            status=PROPERTY_STATUS_DRAFT,
            location=location,
            **validated_data,
        )

        if amenities is not None:
            property_obj.amenities.set(amenities)

        PropertyService._invalidate_cache()
        PropertyService._audit("property_create", getattr(owner, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    @transaction.atomic
    def update_property(property_obj, user, validated_data):
        ServiceGuards.ensure_owner_or_staff(property_obj, user)

        if property_obj.status in {PROPERTY_STATUS_RENTED, PROPERTY_STATUS_EXPIRED}:
            raise PermissionDenied("Cannot edit rented/expired property")

        amenities = validated_data.pop("amenity_ids", None)
        location = PropertyService._resolve_location(validated_data, current_location=property_obj.location)
        for attr, value in validated_data.items():
            setattr(property_obj, attr, value)

        if location is not None:
            property_obj.location = location

        property_obj.status = PROPERTY_STATUS_DRAFT
        property_obj.save()

        if amenities is not None:
            property_obj.amenities.set(amenities)

        PropertyService._invalidate_cache()
        PropertyService._audit("property_update", getattr(user, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    @transaction.atomic
    def submit_for_approval(property_obj, user):
        ServiceGuards.ensure_owner_or_staff(property_obj, user)

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_DRAFT},
            "Only draft properties can be submitted",
        )

        property_obj.status = PROPERTY_STATUS_PENDING
        property_obj.save(update_fields=["status"])
        PropertyService._invalidate_cache()
        PropertyService._audit("property_submit", getattr(user, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    @transaction.atomic
    def activate_property(property_obj, actor):
        if not actor.is_staff:
            raise PermissionDenied("Only admins can activate properties")

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_PENDING},
            "Only pending properties can be activated",
        )

        property_obj.status = PROPERTY_STATUS_ACTIVE
        property_obj.save(update_fields=["status"])

        NotificationService.create_notification(
            recipient=property_obj.owner,
            notification_type=NOTIFICATION_PROPERTY_APPROVED,
            title="Property Approved",
            message="Your property has been approved and is now live.",
            reference_id=property_obj.id,
        )
        PropertyService._invalidate_cache()
        PropertyService._audit("property_activate", getattr(actor, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    @transaction.atomic
    def reject_property(property_obj, actor, reason=None):
        if not actor.is_staff:
            raise PermissionDenied("Only admins can reject properties")

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_PENDING},
            "Only pending properties can be rejected",
        )

        property_obj.status = PROPERTY_STATUS_REJECTED
        property_obj.save(update_fields=["status"])

        NotificationService.create_notification(
            recipient=property_obj.owner,
            notification_type=NOTIFICATION_PROPERTY_REJECTED,
            title="Property Rejected",
            message=reason or "Your property was rejected during moderation.",
            reference_id=property_obj.id,
        )
        PropertyService._invalidate_cache()
        PropertyService._audit("property_reject", getattr(actor, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    @transaction.atomic
    def mark_as_rented(property_obj, user):
        ServiceGuards.ensure_owner_or_staff(property_obj, user)

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_ACTIVE},
            "Only active properties can be marked as rented",
        )

        property_obj.status = PROPERTY_STATUS_RENTED
        property_obj.save(update_fields=["status"])
        PropertyService._invalidate_cache()
        PropertyService._audit("property_mark_rented", getattr(user, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    def increment_views(property_obj):
        from django.conf import settings

        if getattr(settings, "USE_ASYNC_ANALYTICS", False) and hasattr(increment_property_views, "delay"):
            increment_property_views.delay(str(property_obj.id))
        else:
            Property.objects.filter(id=property_obj.id).update(total_views=models.F("total_views") + 1)
        PropertyService._audit("property_increment_view", None, property_obj.id)

    @staticmethod
    @transaction.atomic
    def feature_property(property_obj, actor, days=7):
        if not actor.is_staff:
            raise PermissionDenied("Only admins can feature properties")

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_ACTIVE},
            "Only active properties can be featured",
        )

        if days <= 0:
            raise ValidationError("Feature duration must be greater than zero")

        property_obj.is_featured = True
        property_obj.featured_until = timezone.now() + timezone.timedelta(days=days)
        property_obj.save(update_fields=["is_featured", "featured_until"])
        return property_obj

    @staticmethod
    @transaction.atomic
    def expire_property(property_obj, actor):
        ServiceGuards.ensure_owner_or_staff(property_obj, actor)

        ServiceGuards.ensure_status(
            property_obj.status,
            {PROPERTY_STATUS_ACTIVE},
            "Only active properties can be expired",
        )

        property_obj.status = PROPERTY_STATUS_EXPIRED
        property_obj.save(update_fields=["status"])
        PropertyService._invalidate_cache()
        PropertyService._audit("property_expire", getattr(actor, "id", None), getattr(property_obj, "id", None))
        return property_obj

    @staticmethod
    def list_images(property_obj, actor):
        if (
            property_obj.status != PROPERTY_STATUS_ACTIVE
            and not getattr(actor, "is_staff", False)
            and property_obj.owner_id != actor.id
        ):
            raise PermissionDenied("Images are available only for active listings")

        return PropertyImage.objects.filter(property=property_obj).order_by("order", "created_at")

    @staticmethod
    @transaction.atomic
    def add_image(property_obj, actor, image_file, is_primary=False, order=None):
        ServiceGuards.ensure_owner_or_staff(property_obj, actor)

        if order is None:
            current_max = PropertyImage.objects.filter(property=property_obj).aggregate(
                max_order=Max("order")
            )["max_order"]
            order = (current_max or 0) + 1 if current_max is not None else 0

        image_obj = PropertyImage.objects.create(
            property=property_obj,
            image=image_file,
            is_primary=False,
            order=order,
        )

        has_primary = PropertyImage.objects.filter(
            property=property_obj,
            is_primary=True,
        ).exists()
        if is_primary or not has_primary:
            PropertyService.set_primary_image(property_obj, actor, image_obj)

        return image_obj

    @staticmethod
    @transaction.atomic
    def set_primary_image(property_obj, actor, image_obj):
        ServiceGuards.ensure_owner_or_staff(property_obj, actor)
        if image_obj.property_id != property_obj.id:
            raise ValidationError("Image does not belong to this property")

        PropertyImage.objects.filter(property=property_obj, is_primary=True).exclude(
            id=image_obj.id
        ).update(is_primary=False)
        if not image_obj.is_primary:
            image_obj.is_primary = True
            image_obj.save(update_fields=["is_primary"])
        PropertyService._invalidate_cache()
        PropertyService._audit("property_set_primary_image", getattr(actor, "id", None), getattr(property_obj, "id", None))
        return image_obj

    @staticmethod
    @transaction.atomic
    def delete_image(property_obj, actor, image_obj):
        ServiceGuards.ensure_owner_or_staff(property_obj, actor)
        if image_obj.property_id != property_obj.id:
            raise ValidationError("Image does not belong to this property")

        was_primary = image_obj.is_primary
        image_obj.delete()

        if was_primary:
            fallback = PropertyImage.objects.filter(property=property_obj).order_by("order", "created_at").first()
            if fallback and not fallback.is_primary:
                fallback.is_primary = True
                fallback.save(update_fields=["is_primary"])
        PropertyService._invalidate_cache()
        PropertyService._audit("property_delete_image", getattr(actor, "id", None), getattr(property_obj, "id", None))
        return True

    @staticmethod
    def _audit(event, actor_id, resource_id):
        from django.conf import settings

        if not getattr(settings, "AUDIT_LOG_ENABLED", False):
            return
        PropertyService.logger.info(
            "AUDIT %s actor=%s resource=%s",
            event,
            actor_id,
            resource_id,
        )

    @staticmethod
    def _invalidate_cache():
        try:
            if not cache.add("properties:cache:version", 1):
                cache.incr("properties:cache:version")
        except Exception as exc:
            PropertyService.logger.warning("Cache invalidation failed: %s", exc)
