from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import hashlib
import hmac
import logging
import secrets

logger = logging.getLogger(__name__)

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
import requests
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import EmailOTP, User
from core.models import Location
from core.constants import OWNER_ROLE, TENANT_ROLE


class FirebaseAuthError(ValidationError):
    pass


@dataclass
class AuthTokens:
    access: str
    refresh: str


class UserService:
    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _is_disposable_email(email: str) -> bool:
        domains = {
            d.strip().lower()
            for d in getattr(settings, "DISPOSABLE_EMAIL_DOMAINS", [])
            if isinstance(d, str) and d.strip()
        }
        if not domains:
            return False
        if "@" not in email:
            return False
        domain = email.rsplit("@", 1)[-1].lower()
        return domain in domains

    @staticmethod
    def _clean_phone(phone: str | None) -> str | None:
        if phone is None:
            return None
        cleaned = phone.strip()
        return cleaned or None

    @staticmethod
    def _ensure_unique_identity(
        *,
        email: str | None = None,
        phone: str | None = None,
        exclude_user_id=None,
    ) -> None:
        if email:
            qs = User.objects.filter(email=email)
            if exclude_user_id is not None:
                qs = qs.exclude(id=exclude_user_id)
            if qs.exists():
                raise ValidationError("Email is already in use")

        if phone:
            qs = User.objects.filter(phone=phone)
            if exclude_user_id is not None:
                qs = qs.exclude(id=exclude_user_id)
            if qs.exists():
                raise ValidationError("Phone number is already in use")

    @staticmethod
    def _flatten_location_payload(payload: dict) -> dict:
        normalized = payload.copy()
        nested_location = normalized.pop("location", None)
        if isinstance(nested_location, dict):
            normalized.update(nested_location)
        return normalized

    @staticmethod
    def _create_location_from_payload(payload: dict, current_location: Location | None = None) -> Location | None:
        location_field_map = {
            "address": "address",
            "city": "city",
            "state": "state",
            "country": "country",
            "pincode": "pincode",
            "locality": "locality",
            "lat": "latitude",
            "lng": "longitude",
        }
        if not any(field in payload for field in location_field_map):
            return None

        location_data = {}
        for payload_key, model_key in location_field_map.items():
            if payload_key in payload:
                location_data[model_key] = payload[payload_key]
            elif current_location is not None:
                location_data[model_key] = getattr(current_location, model_key)
            else:
                location_data[model_key] = None if model_key in {"latitude", "longitude"} else ""

        return Location.objects.create(**location_data)

    @staticmethod
    def _issue_tokens(user: User, remember_me: bool = False) -> AuthTokens:
        refresh = RefreshToken.for_user(user)
        if remember_me:
            refresh.set_exp(lifetime=timedelta(days=30))
        return AuthTokens(access=str(refresh.access_token), refresh=str(refresh))

    @staticmethod
    def _hash_email_otp(email: str, otp: str) -> str:
        secret = getattr(settings, "EMAIL_OTP_SECRET", settings.SECRET_KEY)
        material = f"{UserService._normalize_email(email)}:{otp}".encode("utf-8")
        return hmac.new(secret.encode("utf-8"), material, hashlib.sha256).hexdigest()

    @staticmethod
    def _generate_otp() -> str:
        length = max(4, min(int(getattr(settings, "EMAIL_OTP_LENGTH", 6)), 8))
        return str(secrets.randbelow(10**length)).zfill(length)

    @staticmethod
    def _send_email_via_brevo(to_email: str, otp: str, ttl_minutes: int) -> None:
        api_key = getattr(settings, "BREVO_API_KEY", None)
        sender_email = getattr(settings, "BREVO_SENDER_EMAIL", None)
        sender_name = getattr(settings, "BREVO_SENDER_NAME", "GharBazar")
        base_url = getattr(settings, "BREVO_BASE_URL", "https://api.brevo.com/v3")
        timeout = int(getattr(settings, "BREVO_TIMEOUT_SECONDS", 10))

        if not api_key:
            raise ValidationError("BREVO_API_KEY is not configured")
        if not sender_email:
            raise ValidationError("BREVO_SENDER_EMAIL is not configured")

        subject = "Your GharBazar verification code"
        text_content = f"Your OTP is {otp}. It expires in {ttl_minutes} minutes."
        html_content = (
            "<p>Your GharBazar OTP is:</p>"
            f"<p><strong style='font-size:22px;letter-spacing:2px'>{otp}</strong></p>"
            f"<p>This code expires in {ttl_minutes} minutes.</p>"
        )

        try:
            response = requests.post(
                f"{base_url.rstrip('/')}/smtp/email",
                headers={
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": api_key,
                },
                json={
                    "sender": {"email": sender_email, "name": sender_name},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "textContent": text_content,
                    "htmlContent": html_content,
                },
                timeout=timeout,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ValidationError("Unable to send OTP right now") from exc

    @staticmethod
    def _verify_with_firebase_admin(firebase_token: str) -> dict:
        try:
            from firebase_admin import auth
        except ImportError as exc:
            raise FirebaseAuthError("firebase-admin package is not installed") from exc

        try:
            return auth.verify_id_token(firebase_token)
        except Exception as exc:
            raise FirebaseAuthError(f"Invalid Firebase token: {str(exc)}") from exc

    @staticmethod
    def verify_firebase_token(firebase_token: str) -> dict:
        if not firebase_token:
            raise FirebaseAuthError("firebase_token is required")

        allow_dev_token = getattr(settings, "FIREBASE_ALLOW_DEV_TOKEN", settings.DEBUG)
        if allow_dev_token and firebase_token.startswith("dev:"):
            parts = firebase_token.split(":")
            uid = parts[1] if len(parts) > 1 and parts[1] else None
            email = parts[2] if len(parts) > 2 and parts[2] else None
            phone_number = parts[3] if len(parts) > 3 and parts[3] else None
            if not uid:
                raise FirebaseAuthError("dev token must include uid")
            return {
                "uid": uid,
                "email": email,
                "phone_number": phone_number,
                "email_verified": bool(email),
            }

        return UserService._verify_with_firebase_admin(firebase_token)

    @staticmethod
    @transaction.atomic
    def request_email_otp(email: str) -> None:
        normalized_email = UserService._normalize_email(email)
        if UserService._is_disposable_email(normalized_email):
            raise ValidationError("Disposable email addresses are not allowed")

        ttl_minutes = max(1, int(getattr(settings, "EMAIL_OTP_TTL_MINUTES", 10)))
        max_attempts = max(1, int(getattr(settings, "EMAIL_OTP_MAX_ATTEMPTS", 5)))
        daily_limit = max(1, int(getattr(settings, "EMAIL_OTP_DAILY_LIMIT", 10)))
        lockout_minutes = max(1, int(getattr(settings, "EMAIL_OTP_LOCKOUT_MINUTES", 15)))
        now = timezone.now()

        # --- Per-email daily OTP request limit ---
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_count = EmailOTP.objects.filter(
            email=normalized_email,
            created_at__gte=day_start,
        ).count()
        if daily_count >= daily_limit:
            raise ValidationError("Too many OTP requests today. Please try again tomorrow.")

        # --- Lockout after max failed attempts ---
        last_otp = (
            EmailOTP.objects.filter(
                email=normalized_email,
                purpose=EmailOTP.PURPOSE_LOGIN,
            )
            .order_by("-created_at")
            .first()
        )
        if last_otp and last_otp.attempts >= last_otp.max_attempts:
            lockout_until = last_otp.updated_at + timedelta(minutes=lockout_minutes)
            if now < lockout_until:
                remaining = int((lockout_until - now).total_seconds() // 60) + 1
                raise ValidationError(
                    f"Account temporarily locked due to too many failed attempts. "
                    f"Try again in {remaining} minutes."
                )

        otp = UserService._generate_otp()

        EmailOTP.objects.filter(
            email=normalized_email,
            purpose=EmailOTP.PURPOSE_LOGIN,
            is_used=False,
        ).update(is_used=True, used_at=now)

        otp_record = EmailOTP.objects.create(
            email=normalized_email,
            purpose=EmailOTP.PURPOSE_LOGIN,
            otp_hash=UserService._hash_email_otp(normalized_email, otp),
            expires_at=now + timedelta(minutes=ttl_minutes),
            max_attempts=max_attempts,
        )

        use_async_email = getattr(settings, "EMAIL_OTP_USE_ASYNC", True)

        if use_async_email:
            # Enqueue send only after DB transaction commits successfully.
            from apps.users.tasks import send_email_otp_task

            transaction.on_commit(
                lambda: send_email_otp_task.delay(normalized_email, otp, ttl_minutes)
            )
        else:
            try:
                UserService._send_email_via_brevo(normalized_email, otp, ttl_minutes)
            except Exception:
                if settings.DEBUG:
                    logger.warning(
                        "Brevo email failed — DEBUG console fallback:\n"
                        "  ╔══════════════════════════════════════╗\n"
                        "  ║  OTP for %-27s ║\n"
                        "  ║  Code: %-30s ║\n"
                        "  ╚══════════════════════════════════════╝",
                        normalized_email, otp,
                    )
                else:
                    otp_record.delete()
                    raise

    @staticmethod
    @transaction.atomic
    def verify_email_otp(
        email: str,
        otp: str,
        role: str | None = None,
        remember_me: bool = False,
    ) -> tuple[User, AuthTokens]:
        normalized_email = UserService._normalize_email(email)
        now = timezone.now()

        if role and role not in {OWNER_ROLE, TENANT_ROLE}:
            raise ValidationError("Invalid role")

        otp_record = (
            EmailOTP.objects.select_for_update()
            .filter(
                email=normalized_email,
                purpose=EmailOTP.PURPOSE_LOGIN,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )
        if otp_record is None:
            raise ValidationError("OTP not found")

        if otp_record.expires_at <= now:
            otp_record.mark_used()
            otp_record.save(update_fields=["is_used", "used_at"])
            raise ValidationError("OTP expired")

        if otp_record.attempts >= otp_record.max_attempts:
            otp_record.mark_used()
            otp_record.save(update_fields=["is_used", "used_at"])
            raise ValidationError("OTP attempts exceeded")

        expected_hash = UserService._hash_email_otp(normalized_email, otp)
        if not hmac.compare_digest(expected_hash, otp_record.otp_hash):
            otp_record.attempts += 1
            update_fields = ["attempts"]
            if otp_record.attempts >= otp_record.max_attempts:
                otp_record.mark_used()
                update_fields.extend(["is_used", "used_at"])
            otp_record.save(update_fields=update_fields)
            raise ValidationError("Invalid OTP")

        otp_record.mark_used()
        otp_record.save(update_fields=["is_used", "used_at"])

        user = User.objects.filter(email=normalized_email).first()
        if user is None:
            user = User.objects.create_user(
                email=normalized_email,
                role=role or TENANT_ROLE,
                is_verified=True,
            )
        else:
            changed_fields = []
            if role and user.role != role:
                user_role_display = "Owner" if user.role == OWNER_ROLE else "Tenant"
                requested_role_display = "Owner" if role == OWNER_ROLE else "Tenant"
                raise PermissionDenied(
                    f"This account is already registered as {user_role_display}. "
                    f"You cannot sign in as {requested_role_display} with this email."
                )
            if not user.is_verified:
                user.is_verified = True
                changed_fields.append("is_verified")
            if changed_fields:
                user.save(update_fields=changed_fields)

        return user, UserService._issue_tokens(user, remember_me=remember_me)

    @staticmethod
    def _assert_role_match(user: User, requested_role: str | None) -> None:
        """Raise PermissionDenied if the requested role conflicts with the user's existing role."""
        if not requested_role or user.role == requested_role:
            return
        existing = "Owner" if user.role == OWNER_ROLE else "Tenant"
        requested = "Owner" if requested_role == OWNER_ROLE else "Tenant"
        raise PermissionDenied(
            f"This account is already registered as {existing}. "
            f"You cannot sign in as {requested}."
        )

    @staticmethod
    def _link_existing_email_user(
        existing_user: User, uid: str, phone: str | None, is_verified: bool, role: str | None
    ) -> User:
        """Auto-link a Firebase UID to an existing email account or raise on conflict."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Attempting to link Firebase UID to existing user - user_id: {existing_user.id}, existing_firebase_uid: {existing_user.firebase_uid}, new_uid: {uid}")
        
        UserService._assert_role_match(existing_user, role)
        
        if existing_user.firebase_uid and existing_user.firebase_uid != uid:
            logger.error(f"Firebase UID mismatch - existing: {existing_user.firebase_uid}, new: {uid}")
            raise ValidationError(
                "This email is already linked to a different Google account. "
                "If you want to switch Google accounts, please contact support or use the account linking feature."
            )

        changed_fields = []
        if existing_user.firebase_uid != uid:
            logger.info(f"Linking Firebase UID {uid} to user {existing_user.id}")
            existing_user.firebase_uid = uid
            changed_fields.append("firebase_uid")

        if phone and existing_user.phone != phone:
            UserService._ensure_unique_identity(phone=phone, exclude_user_id=existing_user.id)
            existing_user.phone = phone
            changed_fields.append("phone")

        if is_verified and not existing_user.is_verified:
            existing_user.is_verified = True
            changed_fields.append("is_verified")

        existing_user.save(update_fields=changed_fields)
        return existing_user

    @staticmethod
    def _create_firebase_user(
        email: str | None, phone: str | None, uid: str, role: str | None, is_verified: bool
    ) -> User:
        """Create a brand-new user from Firebase claims."""
        UserService._ensure_unique_identity(email=email, phone=phone)
        return User.objects.create_user(
            email=email,
            phone=phone,
            firebase_uid=uid,
            role=role or TENANT_ROLE,
            is_verified=is_verified,
        )

    @staticmethod
    def _resolve_new_firebase_user(
        uid: str, email: str | None, phone: str | None, is_verified: bool, role: str | None
    ) -> User:
        """Resolve or create a user for a Firebase UID that doesn't exist yet."""
        import logging
        logger = logging.getLogger(__name__)
        
        if not email and not phone:
            raise FirebaseAuthError("Firebase identity must include email or phone")

        if email:
            existing_user = User.objects.filter(email=email).first()
            logger.info(f"Checking for existing user with email={email}: {'found' if existing_user else 'not found'}")
            if existing_user:
                logger.info(f"Existing user found - firebase_uid: {existing_user.firebase_uid}, role: {existing_user.role}")
                return UserService._link_existing_email_user(existing_user, uid, phone, is_verified, role)

        logger.info(f"Creating new Firebase user - email: {email}, role: {role}")
        return UserService._create_firebase_user(email, phone, uid, role, is_verified)

    @staticmethod
    def _sync_existing_firebase_user(
        user: User, email: str | None, phone: str | None, is_verified: bool, role: str | None
    ) -> User:
        """Sync profile fields on a returning Firebase user."""
        UserService._assert_role_match(user, role)
        changed_fields = []

        if email and user.email != email:
            UserService._ensure_unique_identity(email=email, exclude_user_id=user.id)
            user.email = email
            changed_fields.append("email")

        if phone and user.phone != phone:
            UserService._ensure_unique_identity(phone=phone, exclude_user_id=user.id)
            user.phone = phone
            changed_fields.append("phone")

        if user.is_verified != is_verified:
            user.is_verified = is_verified
            changed_fields.append("is_verified")

        if changed_fields:
            user.save(update_fields=changed_fields)
        return user

    @staticmethod
    @transaction.atomic
    def login_with_firebase(
        firebase_token: str,
        role: str | None = None,
        remember_me: bool = False,
    ) -> tuple[User, AuthTokens]:
        import logging
        logger = logging.getLogger(__name__)
        
        claims = UserService.verify_firebase_token(firebase_token)
        logger.info(f"Firebase claims verified - uid: {claims.get('uid')}, email: {claims.get('email')}")

        uid = claims.get("uid")
        if not uid:
            raise FirebaseAuthError("Firebase token did not include uid")

        email = UserService._normalize_email(claims["email"]) if claims.get("email") else None
        phone = UserService._clean_phone(claims.get("phone_number"))
        is_verified = bool(claims.get("email_verified") or phone)

        if role and role not in {OWNER_ROLE, TENANT_ROLE}:
            raise ValidationError("Invalid role")
        if email and UserService._is_disposable_email(email):
            raise ValidationError("Disposable email addresses are not allowed")

        user = User.objects.filter(firebase_uid=uid).first()
        logger.info(f"User lookup by firebase_uid={uid}: {'found' if user else 'not found'}")
        
        if user is None:
            logger.info(f"Resolving new Firebase user - email: {email}, role: {role}")
            user = UserService._resolve_new_firebase_user(uid, email, phone, is_verified, role)
        else:
            logger.info(f"Syncing existing Firebase user - current role: {user.role}, requested role: {role}")
            user = UserService._sync_existing_firebase_user(user, email, phone, is_verified, role)

        return user, UserService._issue_tokens(user, remember_me=remember_me)

    @staticmethod
    def _normalize_contact_fields(payload: dict, user: User) -> tuple[str | None, str | None]:
        """Return (new_email, new_phone) normalized from payload, falling back to user's current values."""
        new_email = payload.get("email", user.email)
        new_phone = payload.get("phone", user.phone)
        if isinstance(new_email, str):
            new_email = UserService._normalize_email(new_email)
        return new_email, UserService._clean_phone(new_phone)

    @staticmethod
    def _apply_location_update(user: User, payload: dict) -> None:
        """Mutate user.location in-place based on payload. Pops location_id if present."""
        if "location_id" in payload:
            loc_id = payload.pop("location_id")
            if loc_id:
                location = Location.objects.filter(id=loc_id).first()
                if location is None:
                    raise ValidationError("Invalid location_id")
                user.location = location
            else:
                user.location = None
        else:
            new_location = UserService._create_location_from_payload(payload, current_location=user.location)
            if new_location is not None:
                user.location = new_location

    @staticmethod
    def _apply_scalar_fields(user: User, payload: dict) -> None:
        """Set simple scalar fields on user from payload."""
        for field in ("first_name", "last_name", "email", "phone", "role"):
            if field in payload:
                setattr(user, field, payload[field])

    @staticmethod
    @transaction.atomic
    def update_profile(user: User, payload: dict) -> User:
        payload = UserService._flatten_location_payload(payload)

        new_email, new_phone = UserService._normalize_contact_fields(payload, user)

        if not new_email and not new_phone:
            raise ValidationError("Either email or phone is required")

        UserService._ensure_unique_identity(email=new_email, phone=new_phone, exclude_user_id=user.id)

        role = payload.get("role")
        if role and role not in {OWNER_ROLE, TENANT_ROLE}:
            raise ValidationError("Invalid role")
        UserService._assert_role_match(user, role)

        UserService._apply_location_update(user, payload)

        if "email" in payload:
            payload["email"] = new_email
        if "phone" in payload:
            payload["phone"] = new_phone

        UserService._apply_scalar_fields(user, payload)
        user.save()
        return user

    @staticmethod
    @transaction.atomic
    def link_firebase_account(user: User, firebase_token: str) -> User:
        """Explicitly link a Google/Firebase account to an existing user.
        Must be called by the authenticated user themselves."""
        claims = UserService.verify_firebase_token(firebase_token)
        uid = claims.get("uid")
        if not uid:
            raise FirebaseAuthError("Firebase token did not include uid")

        if user.firebase_uid:
            raise ValidationError("Your account is already linked to a Google account.")

        # Ensure no other user has this firebase_uid
        if User.objects.filter(firebase_uid=uid).exists():
            raise ValidationError("This Google account is already linked to another user.")

        user.firebase_uid = uid
        user.save(update_fields=["firebase_uid"])
        return user
