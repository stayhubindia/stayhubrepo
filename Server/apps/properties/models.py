from django.db import models
from django.db.models import Q
from core.models import BaseModel, Location
from apps.users.models import User


class Property(BaseModel):

    PROPERTY_TYPE_CHOICES = (
        ("PG", "PG"),
        ("1RK", "1RK"),
        ("1BHK", "1BHK"),
        ("2BHK", "2BHK"),
        ("3BHK", "3BHK"),
        ("HOUSE", "House"),
        ("COMMERCIAL", "Commercial"),
    )

    FURNISHING_CHOICES = (
        ("FURNISHED", "Furnished"),
        ("SEMI", "Semi Furnished"),
        ("UNFURNISHED", "Unfurnished"),
    )

    STATUS_CHOICES = (
        ("DRAFT", "Draft"),
        ("PENDING", "Pending Approval"),
        ("ACTIVE", "Active"),
        ("RENTED", "Rented"),
        ("EXPIRED", "Expired"),
        ("REJECTED", "Rejected"),
    )

    # Owner
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="properties",
        db_index=True
    )

    # Basic Info
    title = models.CharField(max_length=255)
    description = models.TextField()

    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPE_CHOICES,
        db_index=True
    )

    furnishing = models.CharField(
        max_length=20,
        choices=FURNISHING_CHOICES,
        db_index=True
    )

    # Rental Info
    rent = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bedrooms = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    bathrooms = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    area_sqft = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    total_favorites = models.PositiveIntegerField(default=0)
    available_from = models.DateField(null=True, blank=True)

    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="properties",
        null=True,
        blank=True,
    )

    # PG specific
    preferred_tenant = models.CharField(
        max_length=20,
        choices=(
            ("MALE", "Male"),
            ("FEMALE", "Female"),
            ("ANY", "Any"),
        ),
        default="ANY",
        db_index=True
    )

    # Analytics
    total_views = models.PositiveIntegerField(default=0)
    total_contacts = models.PositiveIntegerField(default=0)

    # Moderation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True
    )

    is_featured = models.BooleanField(default=False, db_index=True)
    featured_until = models.DateTimeField(null=True, blank=True)
    
    amenities = models.ManyToManyField(
        "Amenity",
        blank=True,
        related_name="properties"
    )
    class Meta:
        indexes = [
            models.Index(fields=["property_type", "rent"]),
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["location"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["total_views"]),
            models.Index(fields=["total_favorites"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(rent__gt=0),
                name="rent_must_be_positive"
            )
        ]

    def __str__(self):
        return self.title

class PropertyImage(BaseModel):

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(upload_to="properties/")

    is_primary = models.BooleanField(default=False)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [
            models.Index(fields=["property", "order"]),
            models.Index(fields=["property", "is_primary"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["property"],
                condition=Q(is_primary=True),
                name="unique_primary_image_per_property",
            )
        ]

    def __str__(self):
        return f"{self.property_id} - image {self.order}"

class Amenity(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=100, blank=True)
