from django.db import models
from core.models import BaseModel
from apps.users.models import User


class Notification(BaseModel):

    NOTIFICATION_TYPE_CHOICES = (
        ("PROPERTY_APPROVED", "Property Approved"),
        ("PROPERTY_REJECTED", "Property Rejected"),
        ("NEW_CONTACT", "New Contact"),
        ("NEW_FAVORITE", "New Favorite"),
        ("NEW_MESSAGE", "New Message"),
        ("SYSTEM", "System"),
    )

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_index=True
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPE_CHOICES,
        db_index=True
    )

    title = models.CharField(max_length=255)
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Optional reference (generic reference ID)
    reference_id = models.UUIDField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["notification_type"]),
        ]

    def __str__(self):
        return f"{self.recipient} - {self.notification_type}"
