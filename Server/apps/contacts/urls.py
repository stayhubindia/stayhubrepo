from django.urls import path, include
from rest_framework.routers import SimpleRouter

from apps.contacts.views import ContactCreateAPIView, OwnerLeadListAPIView, TourRequestViewSet

router = SimpleRouter()
router.register(r"contacts/tours", TourRequestViewSet, basename="tours")

urlpatterns = [
    path("contacts/", ContactCreateAPIView.as_view(), name="contacts-create"),
    path("contacts/leads/", OwnerLeadListAPIView.as_view(), name="contacts-owner-leads"),
    path("", include(router.urls)),
]
