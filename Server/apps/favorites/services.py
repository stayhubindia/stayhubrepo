from django.core.exceptions import PermissionDenied
from django.db import models, transaction
from django.db.models import Case, When

from apps.favorites.models import Favorite
from apps.notifications.services import NotificationService
from apps.properties.models import Property
from core.constants import NOTIFICATION_NEW_FAVORITE, PROPERTY_STATUS_ACTIVE, TENANT_ROLE
from core.services import ServiceGuards


class FavoriteService:
    @staticmethod
    @transaction.atomic
    def add_favorite(user, property_obj):
        ServiceGuards.ensure_role(user, {TENANT_ROLE}, "Only tenants can favorite properties")

        if property_obj.status != PROPERTY_STATUS_ACTIVE:
            raise PermissionDenied("Only active properties can be favorited")

        favorite, created = Favorite.objects.get_or_create(user=user, property=property_obj)

        if created:
            Property.objects.filter(id=property_obj.id).update(
                total_favorites=models.F("total_favorites") + 1
            )

            NotificationService.create_notification(
                recipient=property_obj.owner,
                notification_type=NOTIFICATION_NEW_FAVORITE,
                title="New Favorite",
                message="A tenant added your property to favorites.",
                reference_id=property_obj.id,
            )

        return favorite, created

    @staticmethod
    @transaction.atomic
    def remove_favorite(user, property_obj):
        deleted, _ = Favorite.objects.filter(user=user, property=property_obj).delete()

        if deleted:
            Property.objects.filter(id=property_obj.id).update(
                total_favorites=Case(
                    When(total_favorites__gt=0, then=models.F("total_favorites") - 1),
                    default=0,
                )
            )

        return bool(deleted)
