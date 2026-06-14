from django.db import models
from core.models import BaseModel
from apps.users.models import User
from apps.properties.models import Property


class ContactLog(BaseModel):

    CONTACT_TYPE_CHOICES = (
        ("PHONE", "Phone View"),
        ("CHAT", "Chat Message"),
        ("WHATSAPP", "WhatsApp Click"),
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="contact_logs",
        db_index=True
    )

    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="contacts_made",
        db_index=True
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="contacts_received",
        db_index=True
    )

    contact_type = models.CharField(
        max_length=20,
        choices=CONTACT_TYPE_CHOICES,
        default="PHONE",
        db_index=True
    )

    message = models.TextField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["property", "tenant"]),
            models.Index(fields=["owner"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.tenant} → {self.property}"

class TourRequest(BaseModel):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="tour_requests",
        db_index=True
    )

    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tours_requested",
        db_index=True
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tours_received",
        db_index=True
    )

    tour_date = models.DateField(db_index=True)
    tour_time = models.CharField(max_length=20)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True
    )
    
    message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["property", "tenant"]),
            models.Index(fields=["owner", "status"]),
        ]

    def __str__(self):
        return f"Tour: {self.tenant} at {self.property} on {self.tour_date}"
