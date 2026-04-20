from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from core.models import BaseModel, Location


class UserManager(BaseUserManager):

    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError("User must have either email or phone")

        email = self.normalize_email(email) if email else None

        user = self.model(
            email=email,
            phone=phone,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not password:
            raise ValueError("Superuser must have a password")

        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):

    ROLE_CHOICES = (
        ("OWNER", "Owner"),
        ("TENANT", "Tenant"),
        ("ADMIN", "Admin"),
    )

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )

    phone = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="TENANT",
        db_index=True,
    )

    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        related_name="users",
        null=True,
        blank=True,
    )

    firebase_uid = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email or self.phone or str(self.id)


class EmailOTP(BaseModel):
    PURPOSE_LOGIN = "LOGIN"
    PURPOSE_CHOICES = (
        (PURPOSE_LOGIN, "Login"),
    )

    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=64)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default=PURPOSE_LOGIN, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    is_used = models.BooleanField(default=False, db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["email", "purpose", "is_used"]),
            models.Index(fields=["expires_at"]),
        ]
        ordering = ["-created_at"]

    def mark_used(self):
        self.is_used = True
        self.used_at = timezone.now()
