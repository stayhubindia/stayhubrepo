from datetime import date, timedelta

from django.test import TestCase, SimpleTestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from types import SimpleNamespace

from apps.analytics.tasks import aggregate_daily
from apps.analytics.views import LocationHeatmapView, OwnerDashboardView, PropertyDailyView
from apps.analytics.models import LocationHeatmap, OwnerDashboardSnapshot, PropertyDailyAggregate


class AnalyticsViewsTests(TestCase):
    databases = {"default"}

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = SimpleNamespace(
            id=1,
            pk=1,
            is_authenticated=True,
            is_staff=False,
            is_anonymous=False,
        )

    def test_owner_dashboard_requires_authentication(self):
        request = self.factory.get("/api/v1/analytics/dashboard/")
        response = OwnerDashboardView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_heatmap_requires_staff(self):
        request = self.factory.get("/api/v1/analytics/heatmap/")
        force_authenticate(request, user=self.user)
        response = LocationHeatmapView.as_view()(request)
        self.assertEqual(response.status_code, 403)


class AnalyticsTaskTests(TestCase):
    databases = {"default"}

    def test_aggregate_daily_returns_counts(self):
        result = aggregate_daily()
        self.assertIn("properties", result)
        self.assertIn("owners", result)
        self.assertIn("locations", result)
