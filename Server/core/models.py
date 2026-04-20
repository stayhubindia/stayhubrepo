# apps/core/models.py

import uuid
import secrets
import time
from django.db import models


class BaseModel(models.Model):
    @staticmethod
    def _uuid_seq():
        # ULID-like: 48-bit timestamp (ms) + 80 bits of entropy for ordering
        ts_ms = int(time.time() * 1000)
        return uuid.UUID(int=((ts_ms << 80) | secrets.randbits(80)))

    id = models.UUIDField(primary_key=True, default=_uuid_seq.__func__, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class Location(BaseModel):
    country = models.CharField(max_length=100, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True, db_index=True)
    city = models.CharField(max_length=100, blank=True, db_index=True)
    locality = models.CharField(max_length=150, blank=True, db_index=True)
    pincode = models.CharField(max_length=7, blank=True, db_index=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=13, decimal_places=10, null=True, blank=True)
    longitude = models.DecimalField(max_digits=13, decimal_places=10, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["city", "state"]),
            models.Index(fields=["country"]),
            models.Index(fields=["pincode"]),
        ]
        ordering = ["country", "state", "city", "locality"]

    def __str__(self):
        parts = [self.locality, self.city, self.state, self.country]
        return ", ".join([p for p in parts if p])
