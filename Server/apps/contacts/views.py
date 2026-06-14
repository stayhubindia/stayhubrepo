from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.contacts.models import TourRequest
from apps.contacts.serializers import (
    ContactCreateSerializer, 
    ContactLogSerializer,
    TourRequestSerializer,
    TourRequestCreateSerializer
)
from apps.contacts.services import ContactService
from apps.contacts.throttles import ContactCreateThrottle
from apps.properties.models import Property


class ContactCreateAPIView(APIView):
    throttle_classes = [ContactCreateThrottle]

    @extend_schema(request=ContactCreateSerializer, responses={201: ContactLogSerializer})
    def post(self, request):
        serializer = ContactCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        property_obj = get_object_or_404(Property, id=serializer.validated_data["property_id"])
        contact = ContactService.create_contact(
            tenant=request.user,
            property_obj=property_obj,
            contact_type=serializer.validated_data["contact_type"],
            message=serializer.validated_data.get("message"),
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(ContactLogSerializer(contact).data, status=status.HTTP_201_CREATED)


class OwnerLeadListAPIView(APIView):
    @extend_schema(responses={200: ContactLogSerializer(many=True)})
    def get(self, request):
        queryset = ContactService.list_owner_leads(request.user)
        return Response(ContactLogSerializer(queryset, many=True).data, status=status.HTTP_200_OK)


class TourRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TourRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Tenants see their requests, Owners see requests on their properties
        if user.is_tenant:
            return TourRequest.objects.filter(tenant=user)
        return TourRequest.objects.filter(owner=user)

    @extend_schema(request=TourRequestCreateSerializer, responses={201: TourRequestSerializer})
    def create(self, request, *args, **kwargs):
        serializer = TourRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        property_obj = get_object_or_404(Property, id=serializer.validated_data["property_id"])
        
        tour = TourRequest.objects.create(
            property=property_obj,
            tenant=request.user,
            owner=property_obj.owner,
            tour_date=serializer.validated_data["tour_date"],
            tour_time=serializer.validated_data["tour_time"],
            message=serializer.validated_data.get("message", "")
        )
        
        return Response(TourRequestSerializer(tour).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        # Only owners should be able to update status
        instance = self.get_object()
        if request.user != instance.owner:
            return Response({"detail": "Not authorized to update this tour."}, status=status.HTTP_403_FORBIDDEN)
            
        new_status = request.data.get("status")
        if new_status in dict(TourRequest.STATUS_CHOICES):
            instance.status = new_status
            instance.save()
            return Response(TourRequestSerializer(instance).data)
            
        return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
