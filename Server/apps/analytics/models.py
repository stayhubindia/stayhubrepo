from django.db import models
from core.models import BaseModel, Location
from apps.users.models import User
from apps.properties.models import Property


class PropertyDailyAggregate(BaseModel):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="daily_aggregates")
    date = models.DateField(db_index=True)
    views = models.PositiveIntegerField(default=0)
    favorites = models.PositiveIntegerField(default=0)
    contacts = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("property", "date")
        indexes = [
            models.Index(fields=["property", "date"]),
        ]


class LocationHeatmap(BaseModel):
    date = models.DateField(db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="heatmaps")
    views = models.PositiveIntegerField(default=0)
    favorites = models.PositiveIntegerField(default=0)
    contacts = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("location", "date")
        indexes = [
            models.Index(fields=["location", "date"]),
            models.Index(fields=["date"]),
        ]


class OwnerDashboardSnapshot(BaseModel):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="dashboard_snapshots")
    date = models.DateField(db_index=True)
    total_views = models.PositiveIntegerField(default=0)
    total_favorites = models.PositiveIntegerField(default=0)
    total_contacts = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("owner", "date")
        indexes = [
            models.Index(fields=["owner", "date"]),
        ]
