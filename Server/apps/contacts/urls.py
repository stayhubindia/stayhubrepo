from django.urls import path

from apps.contacts.views import ContactCreateAPIView, OwnerLeadListAPIView

urlpatterns = [
    path("contacts/", ContactCreateAPIView.as_view(), name="contacts-create"),
    path("contacts/leads/", OwnerLeadListAPIView.as_view(), name="contacts-owner-leads"),
]
