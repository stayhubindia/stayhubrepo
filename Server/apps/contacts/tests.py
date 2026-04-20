from types import SimpleNamespace
import uuid
from unittest.mock import Mock, patch

from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.contacts.models import ContactLog
from apps.contacts.views import ContactCreateAPIView, OwnerLeadListAPIView
from core.models import Location
from apps.properties.models import Property
from apps.contacts.services import ContactService
from apps.users.models import User


class ContactServiceTests(SimpleTestCase):
    def test_list_owner_leads_requires_owner_role(self):
        tenant = SimpleNamespace(role="TENANT")

        with self.assertRaises(PermissionDenied):
            ContactService.list_owner_leads(tenant)

    def test_create_contact_success(self):
        tenant = SimpleNamespace(id=uuid.uuid4(), role="TENANT")
        owner = SimpleNamespace(id=uuid.uuid4())
        property_obj = SimpleNamespace(id=uuid.uuid4(), owner=owner, owner_id=owner.id, status="ACTIVE")
        contact = SimpleNamespace()
        create_qs = Mock()

        with patch(
            "apps.contacts.services.ContactLog.objects.create",
            return_value=contact,
        ) as create_mock, patch(
            "apps.contacts.services.Property.objects.filter",
            return_value=create_qs,
        ) as filter_mock, patch(
            "apps.contacts.services.NotificationService.create_notification",
        ) as notify_mock:
            result = ContactService.create_contact.__wrapped__(
                tenant=tenant,
                property_obj=property_obj,
                contact_type="PHONE",
                message="Hi",
                ip="127.0.0.1",
            )

        self.assertEqual(result, contact)
        create_mock.assert_called_once()
        filter_mock.assert_called_once_with(id=property_obj.id)
        create_qs.update.assert_called_once()
        notify_mock.assert_called_once()


class ContactModelMetaTests(SimpleTestCase):
    def test_contact_indexes_exist(self):
        index_fields = {tuple(index.fields) for index in ContactLog._meta.indexes}
        self.assertIn(("property", "tenant"), index_fields)
        self.assertIn(("owner",), index_fields)


class ContactAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.owner = User(id=uuid.uuid4(), email="owner@example.com", role="OWNER")
        self.tenant = User(id=uuid.uuid4(), email="tenant@example.com", role="TENANT")
        self.location = Location(
            country="India",
            state="Karnataka",
            city="Bengaluru",
            locality="Koramangala",
            pincode="560095",
            address="Road 5",
        )
        self.property_obj = Property(
            id=uuid.uuid4(),
            owner=self.owner,
            title="2BHK",
            description="Near park",
            property_type="2BHK",
            furnishing="FURNISHED",
            rent=25000,
            location=self.location,
            status="ACTIVE",
        )

    def test_contact_create_requires_authentication(self):
        request = self.factory.post("/api/v1/contacts/", {}, format="json")
        response = ContactCreateAPIView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_contact_create_calls_service(self):
        contact = ContactLog(
            property=self.property_obj,
            tenant=self.tenant,
            owner=self.owner,
            contact_type="PHONE",
        )
        with patch(
            "apps.contacts.views.get_object_or_404",
            return_value=self.property_obj,
        ), patch(
            "apps.contacts.views.ContactService.create_contact",
            return_value=contact,
        ) as create_mock:
            request = self.factory.post(
                "/api/v1/contacts/",
                {
                    "property_id": str(self.property_obj.id),
                    "contact_type": "PHONE",
                },
                format="json",
            )
            force_authenticate(request, user=self.tenant)
            response = ContactCreateAPIView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        create_mock.assert_called_once()

    def test_owner_lead_list_calls_service(self):
        with patch(
            "apps.contacts.views.ContactService.list_owner_leads",
            return_value=[],
        ) as list_mock:
            request = self.factory.get("/api/v1/contacts/leads/")
            force_authenticate(request, user=self.owner)
            response = OwnerLeadListAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        list_mock.assert_called_once()
