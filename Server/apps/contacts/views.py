from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contacts.serializers import ContactCreateSerializer, ContactLogSerializer
from apps.contacts.services import ContactService
from apps.contacts.throttles import ContactCreateThrottle
from apps.properties.models import Property


class ContactCreateAPIView(APIView):
    throttle_classes = [ContactCreateThrottle]

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
    def get(self, request):
        queryset = ContactService.list_owner_leads(request.user)
        return Response(ContactLogSerializer(queryset, many=True).data, status=status.HTTP_200_OK)
