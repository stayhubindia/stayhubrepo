import uuid
from types import SimpleNamespace
from unittest.mock import Mock
from unittest.mock import patch

from django.core.exceptions import PermissionDenied
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.properties.models import Property, PropertyImage
from apps.properties.serializers import PropertyListSerializer
from core.models import Location
from apps.properties.services import PropertyService
from apps.properties.views import PropertyViewSet
from apps.users.models import User


class PropertyServiceTests(SimpleTestCase):
    def test_submit_for_approval_requires_draft(self):
        owner = SimpleNamespace(id=1)
        property_obj = SimpleNamespace(owner_id=1, status="ACTIVE", save=Mock())

        with self.assertRaises(ValidationError):
            PropertyService.submit_for_approval(property_obj, owner)

    def test_mark_as_rented_requires_owner(self):
        owner = SimpleNamespace(id=1)
        other_user = SimpleNamespace(id=2)
        property_obj = SimpleNamespace(owner_id=1, status="ACTIVE", save=Mock())

        with self.assertRaises(PermissionDenied):
            PropertyService.mark_as_rented(property_obj, other_user)

        rented = PropertyService.mark_as_rented(property_obj, owner)
        self.assertEqual(rented.status, "RENTED")

    def test_add_image_requires_owner_or_staff(self):
        owner = SimpleNamespace(id=1, is_staff=False)
        other_user = SimpleNamespace(id=2, is_staff=False)
        property_obj = SimpleNamespace(owner_id=owner.id)

        with self.assertRaises(PermissionDenied):
            PropertyService.add_image.__wrapped__(property_obj, other_user, image_file=Mock())

    def test_list_images_private_listing_requires_access(self):
        owner = SimpleNamespace(id=1, is_staff=False)
        other_user = SimpleNamespace(id=2, is_staff=False)
        property_obj = SimpleNamespace(owner_id=owner.id, status="DRAFT")

        with self.assertRaises(PermissionDenied):
            PropertyService.list_images(property_obj, other_user)

    def test_create_property_success_with_amenities(self):
        owner = SimpleNamespace(role="OWNER")
        amenity_ids = [uuid.uuid4()]
        property_obj = SimpleNamespace(amenities=SimpleNamespace(set=Mock()))
        location = SimpleNamespace()
        loc_qs = SimpleNamespace(first=Mock(return_value=location))
        with patch("apps.properties.services.Location.objects.filter", return_value=loc_qs) as loc_filter_mock, patch(
            "apps.properties.services.Property.objects.create", return_value=property_obj
        ) as create_mock:
            result = PropertyService.create_property.__wrapped__(
                owner,
                {"title": "Flat", "amenity_ids": amenity_ids, "location_id": uuid.uuid4()},
            )
        self.assertEqual(result, property_obj)
        loc_filter_mock.assert_called_once()
        create_mock.assert_called_once()
        property_obj.amenities.set.assert_called_once_with(amenity_ids)

    def test_update_property_success(self):
        owner = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(
            owner_id=1,
            status="DRAFT",
            title="Old",
            amenities=SimpleNamespace(set=Mock()),
            save=Mock(),
        )
        updated = PropertyService.update_property.__wrapped__(
            property_obj,
            owner,
            {"title": "New", "amenity_ids": [uuid.uuid4()]},
        )
        self.assertEqual(updated.title, "New")
        self.assertEqual(updated.status, "DRAFT")
        property_obj.save.assert_called_once()
        property_obj.amenities.set.assert_called_once()

    def test_submit_for_approval_success(self):
        owner = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(owner_id=1, status="DRAFT", save=Mock())
        result = PropertyService.submit_for_approval(property_obj, owner)
        self.assertEqual(result.status, "PENDING")
        property_obj.save.assert_called_once_with(update_fields=["status"])

    def test_activate_and_reject_property(self):
        actor = SimpleNamespace(is_staff=True)
        owner = SimpleNamespace(id=uuid.uuid4())
        property_obj = SimpleNamespace(owner=owner, id=uuid.uuid4(), status="PENDING", save=Mock())
        with patch("apps.properties.services.NotificationService.create_notification") as notify_mock:
            activated = PropertyService.activate_property.__wrapped__(property_obj, actor)
        self.assertEqual(activated.status, "ACTIVE")
        notify_mock.assert_called_once()

        property_obj.status = "PENDING"
        property_obj.save = Mock()
        with patch("apps.properties.services.NotificationService.create_notification") as reject_notify_mock:
            rejected = PropertyService.reject_property.__wrapped__(property_obj, actor, reason="Missing info")
        self.assertEqual(rejected.status, "REJECTED")
        reject_notify_mock.assert_called_once()

    def test_increment_views_updates_counter(self):
        property_obj = SimpleNamespace(id=uuid.uuid4())
        filter_qs = Mock()
        with patch("apps.properties.services.Property.objects.filter", return_value=filter_qs) as filter_mock:
            PropertyService.increment_views(property_obj)
        filter_mock.assert_called_once_with(id=property_obj.id if isinstance(property_obj.id, str) else str(property_obj.id))
        filter_qs.update.assert_called_once()

    def test_feature_property_and_expire(self):
        actor = SimpleNamespace(id=1, is_staff=True)
        property_obj = SimpleNamespace(status="ACTIVE", is_featured=False, featured_until=None, owner_id=1, save=Mock())
        featured = PropertyService.feature_property(property_obj, actor, days=3)
        self.assertTrue(featured.is_featured)
        property_obj.save.assert_called_once()

        property_obj.status = "ACTIVE"
        property_obj.save = Mock()
        expired = PropertyService.expire_property(property_obj, actor)
        self.assertEqual(expired.status, "EXPIRED")
        property_obj.save.assert_called_once_with(update_fields=["status"])

    def test_feature_property_invalid_days_raises(self):
        actor = SimpleNamespace(is_staff=True)
        property_obj = SimpleNamespace(status="ACTIVE")
        with self.assertRaises(ValidationError):
            PropertyService.feature_property(property_obj, actor, days=0)

    def test_list_images_success(self):
        actor = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(owner_id=1, status="DRAFT")
        order_qs = Mock()
        filter_qs = Mock()
        filter_qs.order_by.return_value = order_qs
        with patch("apps.properties.services.PropertyImage.objects.filter", return_value=filter_qs):
            result = PropertyService.list_images(property_obj, actor)
        self.assertEqual(result, order_qs)

    def test_add_image_sets_primary_when_missing(self):
        actor = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(owner_id=1, id=uuid.uuid4())
        image_obj = SimpleNamespace(id=uuid.uuid4(), property_id=property_obj.id, is_primary=False)

        filter_for_max = Mock()
        filter_for_max.aggregate.return_value = {"max_order": 2}
        filter_for_exists = Mock()
        filter_for_exists.exists.return_value = False

        with patch(
            "apps.properties.services.PropertyImage.objects.filter",
            side_effect=[filter_for_max, filter_for_exists],
        ), patch(
            "apps.properties.services.PropertyImage.objects.create",
            return_value=image_obj,
        ), patch(
            "apps.properties.services.PropertyService.set_primary_image",
            return_value=image_obj,
        ) as set_primary_mock:
            result = PropertyService.add_image.__wrapped__(property_obj, actor, image_file=Mock())

        self.assertEqual(result, image_obj)
        set_primary_mock.assert_called_once()

    def test_set_primary_image_success(self):
        actor = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(owner_id=1, id=uuid.uuid4())
        image_obj = SimpleNamespace(id=uuid.uuid4(), property_id=property_obj.id, is_primary=False, save=Mock())

        filter_qs = Mock()
        exclude_qs = Mock()
        filter_qs.exclude.return_value = exclude_qs
        with patch("apps.properties.services.PropertyImage.objects.filter", return_value=filter_qs):
            result = PropertyService.set_primary_image.__wrapped__(property_obj, actor, image_obj)
        self.assertTrue(result.is_primary)
        exclude_qs.update.assert_called_once_with(is_primary=False)
        image_obj.save.assert_called_once_with(update_fields=["is_primary"])

    def test_delete_image_handles_fallback(self):
        actor = SimpleNamespace(id=1, is_staff=False)
        property_obj = SimpleNamespace(owner_id=1, id=uuid.uuid4())
        image_obj = SimpleNamespace(property_id=property_obj.id, is_primary=True, delete=Mock())
        fallback = SimpleNamespace(is_primary=False, save=Mock())

        order_qs = Mock()
        order_qs.first.return_value = fallback
        filter_qs = Mock()
        filter_qs.order_by.return_value = order_qs
        with patch("apps.properties.services.PropertyImage.objects.filter", return_value=filter_qs):
            result = PropertyService.delete_image.__wrapped__(property_obj, actor, image_obj)
        self.assertTrue(result)
        image_obj.delete.assert_called_once()
        fallback.save.assert_called_once_with(update_fields=["is_primary"])


class PropertyModelMetaTests(SimpleTestCase):
    def test_property_has_positive_rent_constraint(self):
        constraint_names = {constraint.name for constraint in Property._meta.constraints}
        self.assertIn("rent_must_be_positive", constraint_names)

    def test_property_image_has_primary_unique_constraint(self):
        constraint_names = {constraint.name for constraint in PropertyImage._meta.constraints}
        self.assertIn("unique_primary_image_per_property", constraint_names)

    def test_property_image_indexes_exist(self):
        index_fields = {tuple(index.fields) for index in PropertyImage._meta.indexes}
        self.assertIn(("property", "order"), index_fields)
        self.assertIn(("property", "is_primary"), index_fields)


class PropertyAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.owner = User(
            id=uuid.uuid4(),
            email="owner@example.com",
            role="OWNER",
            is_staff=False,
        )

    def _build_property(self, owner):
        location = Location(
            country="India",
            state="Karnataka",
            city="Bengaluru",
            locality="HSR",
            pincode="560102",
            address="Street 1",
            latitude="12.9081000000",
            longitude="77.6476000000",
        )
        return Property(
            id=uuid.uuid4(),
            owner=owner,
            title="2BHK near metro",
            description="Spacious",
            property_type="2BHK",
            furnishing="SEMI",
            rent=12000,
            location=location,
            status="DRAFT",
        )

    def test_list_serializer_includes_location_coordinates(self):
        property_obj = self._build_property(self.owner)

        data = PropertyListSerializer(property_obj).data

        self.assertEqual(data["country"], "India")
        self.assertEqual(data["state"], "Karnataka")
        self.assertEqual(data["city"], "Bengaluru")
        self.assertEqual(data["locality"], "HSR")
        self.assertEqual(data["pincode"], "560102")
        self.assertEqual(data["address"], "Street 1")
        self.assertEqual(data["latitude"], "12.9081000000")
        self.assertEqual(data["longitude"], "77.6476000000")

    def test_create_requires_authentication(self):
        request = self.factory.post("/api/v1/properties/", {}, format="json")
        response = PropertyViewSet.as_view({"post": "create"})(request)
        self.assertEqual(response.status_code, 401)

    def test_create_validation_error_returns_400(self):
        payload = {
            "title": "2BHK near metro",
            "description": "Spacious",
            "property_type": "2BHK",
            "furnishing": "SEMI",
            "rent": "12000.00",
            "location_id": str(uuid.uuid4()),
            "bedrooms": 2,
            "bathrooms": 2,
            "area_sqft": 900,
        }
        with patch(
            "apps.properties.views.PropertyService.create_property",
            side_effect=ValidationError("Only owners can create property"),
        ) as create_mock:
            request = self.factory.post("/api/v1/properties/", payload, format="json")
            force_authenticate(request, user=self.owner)
            response = PropertyViewSet.as_view({"post": "create"})(request)

        self.assertEqual(response.status_code, 400)
        create_mock.assert_called_once()

    def test_feature_invalid_days_returns_400(self):
        property_obj = self._build_property(self.owner)
        with patch.object(PropertyViewSet, "get_object", return_value=property_obj):
            request = self.factory.post(
                f"/api/v1/properties/{property_obj.id}/feature/",
                {"days": "not-int"},
                format="json",
            )
            force_authenticate(request, user=self.owner)
            response = PropertyViewSet.as_view({"post": "feature"})(request, pk=property_obj.id)

        self.assertEqual(response.status_code, 400)

    def test_upload_image_calls_service(self):
        property_obj = self._build_property(self.owner)
        image_file = SimpleUploadedFile("house.jpg", b"fake-image", content_type="image/jpeg")
        image_obj = PropertyImage(
            id=uuid.uuid4(),
            property=property_obj,
            image=image_file,
            is_primary=True,
            order=0,
        )
        serializer_mock = Mock()
        serializer_mock.is_valid.return_value = None
        serializer_mock.validated_data = {"image": image_file, "is_primary": True}

        with patch.object(PropertyViewSet, "get_object", return_value=property_obj), patch(
            "apps.properties.views.PropertyImageUploadSerializer",
            return_value=serializer_mock,
        ), patch(
            "apps.properties.views.PropertyService.add_image",
            return_value=image_obj,
        ) as add_image_mock:
            request = self.factory.post(
                f"/api/v1/properties/{property_obj.id}/images/",
                {},
                format="json",
            )
            force_authenticate(request, user=self.owner)
            response = PropertyViewSet.as_view({"post": "images"})(request, pk=property_obj.id)

        self.assertEqual(response.status_code, 201)
        add_image_mock.assert_called_once()
