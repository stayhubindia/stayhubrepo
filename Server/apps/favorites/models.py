from django.db import models
from core.models import BaseModel
from apps.users.models import User
from apps.properties.models import Property


class Favorite(BaseModel):
    """
    User saves property as favorite.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="favorites",
        db_index=True
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="favorited_by",
        db_index=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "property"],
                name="unique_user_property_favorite"
            )
        ]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["property"]),
        ]

    def __str__(self):
        return f"{self.user} <> {self.property}"
