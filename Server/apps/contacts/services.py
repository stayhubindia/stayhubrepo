from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import F

from apps.contacts.models import ContactLog
from apps.notifications.services import NotificationService
from apps.properties.models import Property
from core.constants import NOTIFICATION_NEW_CONTACT, OWNER_ROLE, PROPERTY_STATUS_ACTIVE, TENANT_ROLE
from core.services import ServiceGuards


class ContactService:
    @staticmethod
    @transaction.atomic
    def create_contact(tenant, property_obj, contact_type="PHONE", message=None, ip=None):
        ServiceGuards.ensure_role(
            tenant,
            {TENANT_ROLE},
            "Only tenants can contact property owners",
        )

        if property_obj.status != PROPERTY_STATUS_ACTIVE:
            raise PermissionDenied("Only active properties can be contacted")

        if property_obj.owner_id == tenant.id:
            raise PermissionDenied("Owners cannot contact their own property")

        owner = property_obj.owner
        contact = ContactLog.objects.create(
            property=property_obj,
            tenant=tenant,
            owner=owner,
            contact_type=contact_type,
            message=message,
            ip_address=ip,
        )

        Property.objects.filter(id=property_obj.id).update(total_contacts=F("total_contacts") + 1)

        NotificationService.create_notification(
            recipient=owner,
            notification_type=NOTIFICATION_NEW_CONTACT,
            title="New Inquiry Received",
            message="A tenant contacted you about your property.",
            reference_id=property_obj.id,
        )

        return contact

    @staticmethod
    def list_owner_leads(owner):
        ServiceGuards.ensure_role(owner, {OWNER_ROLE}, "Only owners can access leads")
        return ContactLog.objects.filter(owner=owner).select_related("property", "tenant")
