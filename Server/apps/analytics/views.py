from datetime import date

from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.analytics.models import LocationHeatmap, OwnerDashboardSnapshot, PropertyDailyAggregate
from apps.analytics.serializers import (
    LocationHeatmapSerializer,
    OwnerDashboardSnapshotSerializer,
    PropertyDailyAggregateSerializer,
)


def _parse_date(param, default=None):
    if param is None:
        return default
    parsed = parse_date(param)
    return parsed or default


def _get_query_param(request, *names):
    for name in names:
        value = request.query_params.get(name)
        if value is not None:
            return value
    return None


class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "analytics_read"

    def get(self, request):
        start = _parse_date(_get_query_param(request, "start", "start_date"), date.today())
        end = _parse_date(_get_query_param(request, "end", "end_date"), start)

        qs = OwnerDashboardSnapshot.objects.filter(owner=request.user, date__range=[start, end]).order_by("-date")
        serializer = OwnerDashboardSnapshotSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropertyDailyView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "analytics_read"

    def get(self, request):
        start = _parse_date(_get_query_param(request, "start", "start_date"), date.today())
        end = _parse_date(_get_query_param(request, "end", "end_date"), start)
        property_id = request.query_params.get("property_id")

        qs = PropertyDailyAggregate.objects.filter(property__owner=request.user, date__range=[start, end])
        if property_id:
            qs = qs.filter(property_id=property_id)
        qs = qs.order_by("property", "-date")
        serializer = PropertyDailyAggregateSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LocationHeatmapView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "analytics_read"

    def get(self, request):
        if not getattr(request.user, "is_staff", False):
            return Response({"detail": "Heatmap access is staff-only"}, status=status.HTTP_403_FORBIDDEN)

        start = _parse_date(_get_query_param(request, "start", "start_date"), date.today())
        end = _parse_date(_get_query_param(request, "end", "end_date"), start)

        qs = LocationHeatmap.objects.filter(date__range=[start, end]).select_related("location").order_by("-views")
        serializer = LocationHeatmapSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
