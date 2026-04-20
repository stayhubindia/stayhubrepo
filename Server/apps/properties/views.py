from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.cache import cache
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.openapi import AutoSchema
import uuid

from apps.properties.filters import PropertyFilter
from apps.properties.models import Property, PropertyImage
from apps.properties.search import apply_search
from apps.properties.serializers import (
    PropertyImageSerializer,
    PropertyImageUploadSerializer,
    PropertyListSerializer,
    PropertySerializer,
)
from apps.properties.services import PropertyService
from apps.properties.throttles import PropertyReadThrottle, PropertyWriteThrottle


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("owner", "location").prefetch_related("amenities", "images")
    filterset_class = PropertyFilter
    search_fields = ["title", "description", "location__city", "location__locality", "location__address"]
    ordering_fields = ["rent", "created_at", "total_views", "total_favorites", "total_contacts"]
    ordering = ["-created_at"]
    write_actions = {
        "create",
        "update",
        "partial_update",
        "submit",
        "activate",
        "reject",
        "mark_rented",
        "feature",
        "expire",
        "images",
        "set_primary_image",
        "delete_image",
    }

    def _cache_version(self):
        version = cache.get("properties:cache:version")
        if version is None:
            cache.add("properties:cache:version", 1)
            version = 1
        return version

    def get_throttles(self):
        throttle_class = PropertyWriteThrottle if self.action in self.write_actions else PropertyReadThrottle
        return [throttle_class()]

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        return PropertySerializer

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        search_term = self.request.query_params.get("q")

        if self.action in {"update", "partial_update", "submit", "mark_rented"}:
            return queryset.filter(owner=user)

        if self.action in {"activate", "reject", "feature", "expire"}:
            if user.is_staff:
                return queryset
            return queryset.filter(owner=user)

        if self.action == "images":
            if self.request.method == "POST":
                if user.is_staff:
                    return queryset
                return queryset.filter(owner=user)
            if user.is_staff:
                return queryset
            return queryset.filter(Q(status="ACTIVE") | Q(owner=user))

        if self.action in {"set_primary_image", "delete_image"}:
            if user.is_staff:
                return queryset
            return queryset.filter(owner=user)

        if self.action == "retrieve":
            if user.is_staff:
                return queryset
            return queryset.filter(Q(status="ACTIVE") | Q(owner=user))

        mine = self.request.query_params.get("mine")
        if mine and mine.lower() == "true":
            if not user.is_authenticated:
                return queryset.none()
            return queryset.filter(owner=user)

        if user.is_staff:
            return apply_search(queryset, search_term)

        return apply_search(queryset.filter(status="ACTIVE"), search_term)

    def create(self, request, *args, **kwargs):
        serializer = PropertySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_obj = PropertyService.create_property(request.user, serializer.validated_data)
        return Response(PropertySerializer(property_obj).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        property_obj = self.get_object()
        serializer = PropertySerializer(property_obj, data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        property_obj = PropertyService.update_property(property_obj, request.user, serializer.validated_data)
        return Response(PropertySerializer(property_obj).data)

    def retrieve(self, request, *args, **kwargs):
        property_obj = self.get_object()
        if property_obj.owner_id != request.user.id:
            PropertyService.increment_views(property_obj)
            property_obj.refresh_from_db()
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        property_obj = self.get_object()
        property_obj = PropertyService.submit_for_approval(property_obj, request.user)
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        property_obj = self.get_object()
        property_obj = PropertyService.activate_property(property_obj, request.user)
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        property_obj = self.get_object()
        reason = request.data.get("reason")
        property_obj = PropertyService.reject_property(property_obj, request.user, reason=reason)
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"], url_path="mark-rented")
    def mark_rented(self, request, pk=None):
        property_obj = self.get_object()
        property_obj = PropertyService.mark_as_rented(property_obj, request.user)
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"])
    def feature(self, request, pk=None):
        property_obj = self.get_object()
        try:
            days = int(request.data.get("days", 7))
        except (TypeError, ValueError) as exc:
            raise ValidationError("days must be an integer") from exc
        property_obj = PropertyService.feature_property(property_obj, request.user, days=days)
        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=["post"])
    def expire(self, request, pk=None):
        property_obj = self.get_object()
        property_obj = PropertyService.expire_property(property_obj, request.user)
        return Response(PropertySerializer(property_obj).data)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="images",
        parser_classes=[MultiPartParser, FormParser],
    )
    def images(self, request, pk=None):
        property_obj = self.get_object()

        if request.method == "GET":
            images = PropertyService.list_images(property_obj, request.user)
            return Response(PropertyImageSerializer(images, many=True).data)

        serializer = PropertyImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_obj = PropertyService.add_image(
            property_obj=property_obj,
            actor=request.user,
            image_file=serializer.validated_data["image"],
            is_primary=serializer.validated_data.get("is_primary", False),
            order=serializer.validated_data.get("order"),
        )
        return Response(PropertyImageSerializer(image_obj).data, status=status.HTTP_201_CREATED)

    @extend_schema(parameters=[OpenApiParameter("image_id", type=uuid.UUID, location=OpenApiParameter.PATH)])
    @action(
        detail=True,
        methods=["post"],
        url_path=r"images/(?P<image_id>[^/.]+)/set-primary",
    )
    def set_primary_image(self, request, pk=None, image_id=None):
        property_obj = self.get_object()
        image_obj = get_object_or_404(PropertyImage, id=image_id, property=property_obj)
        image_obj = PropertyService.set_primary_image(property_obj, request.user, image_obj)
        return Response(PropertyImageSerializer(image_obj).data, status=status.HTTP_200_OK)

    @extend_schema(parameters=[OpenApiParameter("image_id", type=uuid.UUID, location=OpenApiParameter.PATH)])
    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_id>[^/.]+)",
    )
    def delete_image(self, request, pk=None, image_id=None):
        property_obj = self.get_object()
        image_obj = get_object_or_404(PropertyImage, id=image_id, property=property_obj)
        PropertyService.delete_image(property_obj, request.user, image_obj)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="trending")
    def trending(self, request):
        limit = request.query_params.get("limit")
        try:
            limit = int(limit) if limit else 10
        except (TypeError, ValueError) as exc:
            raise ValidationError("limit must be an integer") from exc

        cache_key = f"properties:trending:v{self._cache_version()}:limit:{limit}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = (
            Property.objects.filter(status="ACTIVE")
            .order_by("-total_views", "-total_favorites", "-total_contacts", "-created_at")[:limit]
        )
        serializer = PropertyListSerializer(qs, many=True)
        cache.set(cache_key, serializer.data, getattr(settings, "PROPERTY_TRENDING_CACHE_TTL_SECONDS", 60))
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="cached-list")
    def cached_list(self, request):
        cache_key = f"properties:list:v{self._cache_version()}:u:{request.user.id}:{request.get_full_path()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer_class = self.get_serializer_class()
        if page is not None:
            serializer = serializer_class(page, many=True)
            response = self.get_paginated_response(serializer.data)
            cache.set(cache_key, response.data, getattr(settings, "PROPERTY_LIST_CACHE_TTL_SECONDS", 60))
            return response

        serializer = serializer_class(queryset, many=True)
        cache.set(cache_key, serializer.data, getattr(settings, "PROPERTY_LIST_CACHE_TTL_SECONDS", 60))
        return Response(serializer.data)
