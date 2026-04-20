from django.urls import path

from apps.analytics.views import LocationHeatmapView, OwnerDashboardView, PropertyDailyView

urlpatterns = [
    path("analytics/dashboard/", OwnerDashboardView.as_view(), name="analytics-owner-dashboard"),
    path("analytics/properties/daily/", PropertyDailyView.as_view(), name="analytics-property-daily"),
    path("analytics/heatmap/", LocationHeatmapView.as_view(), name="analytics-heatmap"),
]
