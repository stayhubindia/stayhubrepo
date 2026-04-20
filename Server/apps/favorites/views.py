from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.favorites.models import Favorite
from apps.favorites.serializers import FavoriteCreateSerializer, FavoriteSerializer
from apps.favorites.services import FavoriteService
from apps.properties.models import Property


class FavoriteListCreateAPIView(APIView):
    @extend_schema(responses={200: FavoriteSerializer(many=True)})
    def get(self, request):
        queryset = (
            Favorite.objects
            .filter(user=request.user)
            .select_related("property", "property__location")
            .order_by("-created_at")
        )
        return Response(FavoriteSerializer(queryset, many=True).data)

    @extend_schema(request=FavoriteCreateSerializer, responses={200: FavoriteSerializer, 201: FavoriteSerializer})
    def post(self, request):
        serializer = FavoriteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        property_obj = get_object_or_404(Property, id=serializer.validated_data["property_id"])
        favorite, created = FavoriteService.add_favorite(request.user, property_obj)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(FavoriteSerializer(favorite).data, status=status_code)


class FavoriteDeleteAPIView(APIView):
    @extend_schema(responses={204: OpenApiResponse(description="Deleted")})
    def delete(self, request, property_id):
        property_obj = get_object_or_404(Property, id=property_id)
        deleted = FavoriteService.remove_favorite(request.user, property_obj)
        if not deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_204_NO_CONTENT)
