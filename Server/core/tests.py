from types import SimpleNamespace
import json

from django.core.exceptions import PermissionDenied
from django.test import RequestFactory
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from core.services import ServiceGuards
from server.urls import api_health


class ServiceGuardsTests(SimpleTestCase):
    def test_ensure_role_blocks_invalid_role(self):
        user = SimpleNamespace(role="TENANT")
        with self.assertRaises(PermissionDenied):
            ServiceGuards.ensure_role(user, {"OWNER"})

    def test_ensure_owner_or_staff_allows_staff(self):
        actor = SimpleNamespace(id="user-2", is_staff=True)
        resource = SimpleNamespace(owner_id="user-1")
        ServiceGuards.ensure_owner_or_staff(resource, actor)

    def test_ensure_status_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            ServiceGuards.ensure_status("DRAFT", {"ACTIVE"}, "Invalid transition")


class HealthEndpointTests(SimpleTestCase):
    def test_health_endpoint(self):
        request = RequestFactory().get("/api/v1/health/")
        response = api_health(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content), {"status": "ok"})
