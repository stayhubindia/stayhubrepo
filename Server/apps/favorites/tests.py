from types import SimpleNamespace
import uuid
from unittest.mock import Mock, patch

from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.favorites.models import Favorite
from apps.favorites.views import FavoriteDeleteAPIView, FavoriteListCreateAPIView
from apps.properties.models import Property
from apps.favorites.services import FavoriteService
from apps.users.models import User
from core.models import Location


class FavoriteServiceTests(SimpleTestCase):
    def test_add_favorite_requires_tenant_role(self):
        user = SimpleNamespace(role="OWNER")
        property_obj = SimpleNamespace(status="ACTIVE")

        with self.assertRaises(PermissionDenied):
            FavoriteService.add_favorite.__wrapped__(user, property_obj)

    def test_add_favorite_success_created(self):
        user = SimpleNamespace(role="TENANT")
        owner = SimpleNamespace(id=uuid.uuid4())
        property_obj = SimpleNamespace(id=uuid.uuid4(), status="ACTIVE", owner=owner)
        favorite = SimpleNamespace()
        filter_qs = Mock()

        with patch(
            "apps.favorites.services.Favorite.objects.get_or_create",
            return_value=(favorite, True),
        ) as get_or_create_mock, patch(
            "apps.favorites.services.Property.objects.filter",
            return_value=filter_qs,
        ) as filter_mock, patch(
            "apps.favorites.services.NotificationService.create_notification",
        ) as notify_mock:
            result, created = FavoriteService.add_favorite.__wrapped__(user, property_obj)

        self.assertEqual(result, favorite)
        self.assertTrue(created)
        get_or_create_mock.assert_called_once()
        filter_mock.assert_called_once_with(id=property_obj.id)
        filter_qs.update.assert_called_once()
        notify_mock.assert_called_once()

    def test_remove_favorite_success(self):
        user = SimpleNamespace()
        property_obj = SimpleNamespace(id=uuid.uuid4())
        delete_qs = Mock()
        delete_qs.delete.return_value = (1, {"favorites.Favorite": 1})
        filter_qs = Mock()

        with patch(
            "apps.favorites.services.Favorite.objects.filter",
            return_value=delete_qs,
        ) as fav_filter_mock, patch(
            "apps.favorites.services.Property.objects.filter",
            return_value=filter_qs,
        ):
            deleted = FavoriteService.remove_favorite.__wrapped__(user, property_obj)

        self.assertTrue(deleted)
        fav_filter_mock.assert_called_once_with(user=user, property=property_obj)
        filter_qs.update.assert_called_once()


class FavoriteModelMetaTests(SimpleTestCase):
    def test_unique_user_property_constraint_exists(self):
        constraint_names = {constraint.name for constraint in Favorite._meta.constraints}
        self.assertIn("unique_user_property_favorite", constraint_names)

    def test_indexes_exist(self):
        index_fields = {tuple(index.fields) for index in Favorite._meta.indexes}
        self.assertIn(("user",), index_fields)
        self.assertIn(("property",), index_fields)


class FavoriteAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.tenant = User(id=uuid.uuid4(), email="tenant@example.com", role="TENANT")
        self.owner = User(id=uuid.uuid4(), email="owner@example.com", role="OWNER")
        self.location = Location(
            country="India",
            state="Karnataka",
            city="Bengaluru",
            locality="Indiranagar",
            pincode="560038",
            address="Street",
        )
        self.property_obj = Property(
            id=uuid.uuid4(),
            owner=self.owner,
            title="1BHK",
            description="Nice",
            property_type="1BHK",
            furnishing="SEMI",
            rent=10000,
            location=self.location,
            status="ACTIVE",
        )

    def test_favorite_list_requires_authentication(self):
        request = self.factory.get("/api/v1/favorites/")
        response = FavoriteListCreateAPIView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_create_favorite_calls_service(self):
        favorite = Favorite(user=self.tenant, property=self.property_obj)
        with patch(
            "apps.favorites.views.get_object_or_404",
            return_value=self.property_obj,
        ), patch(
            "apps.favorites.views.FavoriteService.add_favorite",
            return_value=(favorite, True),
        ) as add_mock:
            request = self.factory.post(
                "/api/v1/favorites/",
                {"property_id": str(self.property_obj.id)},
                format="json",
            )
            force_authenticate(request, user=self.tenant)
            response = FavoriteListCreateAPIView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        add_mock.assert_called_once()

    def test_delete_favorite_returns_204(self):
        with patch(
            "apps.favorites.views.get_object_or_404",
            return_value=self.property_obj,
        ), patch(
            "apps.favorites.views.FavoriteService.remove_favorite",
            return_value=True,
        ) as remove_mock:
            request = self.factory.delete(f"/api/v1/favorites/{self.property_obj.id}/")
            force_authenticate(request, user=self.tenant)
            response = FavoriteDeleteAPIView.as_view()(request, property_id=self.property_obj.id)

        self.assertEqual(response.status_code, 204)
        remove_mock.assert_called_once()
