from datetime import timedelta

from django.test import SimpleTestCase, TestCase, override_settings
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from types import SimpleNamespace
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import Mock, patch

from apps.users.models import EmailOTP, User
from apps.users.services import AuthTokens, FirebaseAuthError, UserService
from apps.users.views import EmailOTPRequestAPIView, EmailOTPVerifyAPIView, FirebaseLoginAPIView, MeAPIView


class UserServiceTests(SimpleTestCase):
    @override_settings(FIREBASE_ALLOW_DEV_TOKEN=True)
    def test_verify_firebase_dev_token(self):
        claims = UserService.verify_firebase_token("dev:uid-1:user@example.com:+911234567890")
        self.assertEqual(claims["uid"], "uid-1")
        self.assertEqual(claims["email"], "user@example.com")

    @override_settings(FIREBASE_ALLOW_DEV_TOKEN=True)
    def test_verify_firebase_dev_token_requires_uid(self):
        with self.assertRaisesMessage(ValidationError, "dev token must include uid"):
            UserService.verify_firebase_token("dev:")

    def test_verify_firebase_token_requires_value(self):
        with self.assertRaises(FirebaseAuthError):
            UserService.verify_firebase_token("")

    @override_settings(FIREBASE_ALLOW_DEV_TOKEN=False)
    def test_verify_firebase_token_uses_firebase_admin(self):
        with patch(
            "apps.users.services.UserService._verify_with_firebase_admin",
            return_value={"uid": "u1"},
        ) as verify_mock:
            claims = UserService.verify_firebase_token("real-firebase-token")
        self.assertEqual(claims["uid"], "u1")
        verify_mock.assert_called_once_with("real-firebase-token")

    def test_login_with_firebase_rejects_invalid_role(self):
        with patch(
            "apps.users.services.UserService.verify_firebase_token",
            return_value={"uid": "u1", "email": "a@b.com"},
        ):
            with self.assertRaises(ValidationError):
                UserService.login_with_firebase.__wrapped__("dev:u1:a@b.com", role="INVALID")

    def test_login_with_firebase_creates_new_user(self):
        claims = {"uid": "u1", "email": "tenant@example.com", "phone_number": None, "email_verified": True}
        created_user = User(email="tenant@example.com", firebase_uid="u1", role="TENANT", is_verified=True)

        refresh_token = Mock()
        refresh_token.access_token = "access-token"
        refresh_token.__str__ = Mock(return_value="refresh-token")
        filter_qs = Mock()
        filter_qs.first.return_value = None

        with patch(
            "apps.users.services.UserService.verify_firebase_token",
            return_value=claims,
        ), patch(
            "apps.users.services.User.objects.filter",
            return_value=filter_qs,
        ), patch(
            "apps.users.services.User.objects.create_user",
            return_value=created_user,
        ) as create_user_mock, patch(
            "apps.users.services.RefreshToken.for_user",
            return_value=refresh_token,
        ):
            user, tokens = UserService.login_with_firebase.__wrapped__("dev:u1:tenant@example.com")

        self.assertEqual(user, created_user)
        self.assertEqual(tokens.access, "access-token")
        self.assertEqual(tokens.refresh, "refresh-token")
        create_user_mock.assert_called_once()

    def test_login_with_firebase_updates_existing_user(self):
        claims = {"uid": "u1", "email": "updated@example.com", "phone_number": "+91123", "email_verified": True}
        existing_user = User(email="old@example.com", phone=None, firebase_uid="u1", role="TENANT", is_verified=False)
        existing_user.save = Mock()

        refresh_token = Mock()
        refresh_token.access_token = "access-token"
        refresh_token.__str__ = Mock(return_value="refresh-token")
        filter_qs = Mock()
        filter_qs.first.return_value = existing_user

        with patch(
            "apps.users.services.UserService.verify_firebase_token",
            return_value=claims,
        ), patch(
            "apps.users.services.User.objects.filter",
            return_value=filter_qs,
        ), patch(
            "apps.users.services.RefreshToken.for_user",
            return_value=refresh_token,
        ):
            user, _ = UserService.login_with_firebase.__wrapped__("dev:u1:updated@example.com:+91123")

        self.assertEqual(user.email, "updated@example.com")
        self.assertEqual(user.phone, "+91123")
        existing_user.save.assert_called_once()

    def test_login_with_firebase_auto_links_existing_email_account(self):
        claims = {
            "uid": "new-firebase-uid",
            "email": "tenant@example.com",
            "phone_number": None,
            "email_verified": True,
        }
        existing_user = User(
            email="tenant@example.com",
            phone=None,
            firebase_uid=None,
            role="TENANT",
            is_verified=True,
        )
        existing_user.id = "user-1"
        existing_user.save = Mock()

        refresh_token = Mock()
        refresh_token.access_token = "access-token"
        refresh_token.__str__ = Mock(return_value="refresh-token")

        by_uid_qs = Mock()
        by_uid_qs.first.return_value = None
        by_email_qs = Mock()
        by_email_qs.first.return_value = existing_user

        with patch(
            "apps.users.services.UserService.verify_firebase_token",
            return_value=claims,
        ), patch(
            "apps.users.services.User.objects.filter",
            side_effect=[by_uid_qs, by_email_qs],
        ), patch(
            "apps.users.services.RefreshToken.for_user",
            return_value=refresh_token,
        ):
            user, tokens = UserService.login_with_firebase.__wrapped__("dev:new-firebase-uid:tenant@example.com")

        self.assertEqual(user, existing_user)
        self.assertEqual(user.firebase_uid, "new-firebase-uid")
        self.assertEqual(tokens.access, "access-token")
        self.assertEqual(tokens.refresh, "refresh-token")
        existing_user.save.assert_called_once_with(update_fields=["firebase_uid"])

    def test_login_with_firebase_remember_me_extends_refresh(self):
        claims = {"uid": "u1", "email": "tenant@example.com", "phone_number": None, "email_verified": True}
        created_user = User(email="tenant@example.com", firebase_uid="u1", role="TENANT", is_verified=True)

        refresh_token = Mock()
        refresh_token.access_token = "access-token"
        refresh_token.__str__ = Mock(return_value="refresh-token")
        refresh_token.set_exp = Mock()
        filter_qs = Mock()
        filter_qs.first.return_value = None

        with patch(
            "apps.users.services.UserService.verify_firebase_token",
            return_value=claims,
        ), patch(
            "apps.users.services.User.objects.filter",
            return_value=filter_qs,
        ), patch(
            "apps.users.services.User.objects.create_user",
            return_value=created_user,
        ), patch(
            "apps.users.services.RefreshToken.for_user",
            return_value=refresh_token,
        ):
            _, _ = UserService.login_with_firebase.__wrapped__(
                "dev:u1:tenant@example.com",
                remember_me=True,
            )

        refresh_token.set_exp.assert_called_once()

    def test_update_profile_requires_email_or_phone(self):
        user = User(email="owner@example.com", phone="+91111", role="OWNER")
        with self.assertRaises(ValidationError):
            UserService.update_profile.__wrapped__(user, {"email": None, "phone": None})

    def test_update_profile_blocks_owner_role_downgrade_with_properties(self):
        user = SimpleNamespace(
            email="owner@example.com",
            phone="+91111",
            role="OWNER",
            save=Mock(),
            properties=SimpleNamespace(exists=Mock(return_value=True)),
        )
        with self.assertRaises(PermissionDenied):
            UserService.update_profile.__wrapped__(user, {"role": "TENANT"})

    def test_update_profile_updates_fields(self):
        user = SimpleNamespace(
            email="owner@example.com",
            phone="+91111",
            role="OWNER",
            first_name="",
            last_name="",
            save=Mock(),
            properties=SimpleNamespace(exists=Mock(return_value=False)),
        )
        updated = UserService.update_profile.__wrapped__(user, {"first_name": "Durgesh", "role": "OWNER"})
        self.assertEqual(updated.first_name, "Durgesh")
        user.save.assert_called_once()


class UserAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_me_requires_authentication(self):
        request = self.factory.get("/api/v1/users/me/")
        response = MeAPIView.as_view()(request)
        self.assertEqual(response.status_code, 401)

    def test_firebase_login_returns_tokens(self):
        user = User(email="tenant@example.com", role="TENANT")
        tokens = AuthTokens(access="access-token", refresh="refresh-token")
        with patch(
            "apps.users.views.UserService.login_with_firebase",
            return_value=(user, tokens),
        ) as login_mock:
            request = self.factory.post(
                "/api/v1/auth/firebase/login/",
                {"firebase_token": "dev:user-1:tenant@example.com"},
                format="json",
            )
            response = FirebaseLoginAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tokens"]["access"], "access-token")
        login_mock.assert_called_once()

    def test_firebase_login_passes_remember_me(self):
        user = User(email="tenant@example.com", role="TENANT")
        tokens = AuthTokens(access="access-token", refresh="refresh-token")
        with patch(
            "apps.users.views.UserService.login_with_firebase",
            return_value=(user, tokens),
        ) as login_mock:
            request = self.factory.post(
                "/api/v1/auth/firebase/login/",
                {"firebase_token": "dev:user-1:tenant@example.com", "remember_me": True},
                format="json",
            )
            response = FirebaseLoginAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        login_mock.assert_called_once_with(
            firebase_token="dev:user-1:tenant@example.com",
            role=None,
            remember_me=True,
        )

    def test_me_patch_calls_service(self):
        user = User(email="owner@example.com", role="OWNER")
        updated_user = User(
            email="owner@example.com",
            role="OWNER",
            first_name="Durgesh",
        )
        with patch(
            "apps.users.views.UserService.update_profile",
            return_value=updated_user,
        ) as update_mock:
            request = self.factory.patch(
                "/api/v1/users/me/",
                {"first_name": "Durgesh"},
                format="json",
            )
            force_authenticate(request, user=user)
            response = MeAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["first_name"], "Durgesh")
        update_mock.assert_called_once()


@override_settings(
    BREVO_API_KEY="test-brevo-key",
    BREVO_SENDER_EMAIL="noreply@gharbazar.test",
    EMAIL_OTP_SECRET="otp-secret",
    EMAIL_OTP_TTL_MINUTES=10,
    EMAIL_OTP_MAX_ATTEMPTS=5,
    EMAIL_OTP_LENGTH=6,
)
class EmailOTPTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("apps.users.services.requests.post")
    @patch("apps.users.services.UserService._generate_otp", return_value="123456")
    def test_request_email_otp_creates_record_and_sends_brevo_email(self, _otp_mock, post_mock):
        response = Mock()
        response.raise_for_status = Mock()
        post_mock.return_value = response

        UserService.request_email_otp.__wrapped__("user@example.com")

        otp = EmailOTP.objects.get(email="user@example.com")
        self.assertEqual(otp.purpose, EmailOTP.PURPOSE_LOGIN)
        self.assertFalse(otp.is_used)
        self.assertEqual(otp.attempts, 0)
        post_mock.assert_called_once()

    @patch("apps.users.services.RefreshToken.for_user")
    def test_verify_email_otp_success_creates_user_and_tokens(self, refresh_mock):
        refresh_token = Mock()
        refresh_token.access_token = "access-token"
        refresh_token.__str__ = Mock(return_value="refresh-token")
        refresh_mock.return_value = refresh_token

        EmailOTP.objects.create(
            email="tenant@example.com",
            purpose=EmailOTP.PURPOSE_LOGIN,
            otp_hash=UserService._hash_email_otp("tenant@example.com", "123456"),
            expires_at=timezone.now() + timedelta(minutes=10),
            max_attempts=5,
        )

        user, tokens = UserService.verify_email_otp.__wrapped__(
            email="tenant@example.com",
            otp="123456",
            role="TENANT",
            remember_me=False,
        )
        self.assertEqual(user.email, "tenant@example.com")
        self.assertEqual(tokens.access, "access-token")
        self.assertEqual(tokens.refresh, "refresh-token")
        self.assertTrue(User.objects.filter(email="tenant@example.com").exists())

    def test_verify_email_otp_invalid_code_increments_attempts(self):
        otp = EmailOTP.objects.create(
            email="tenant@example.com",
            purpose=EmailOTP.PURPOSE_LOGIN,
            otp_hash=UserService._hash_email_otp("tenant@example.com", "123456"),
            expires_at=timezone.now() + timedelta(minutes=10),
            max_attempts=2,
        )

        with self.assertRaisesMessage(ValidationError, "Invalid OTP"):
            UserService.verify_email_otp.__wrapped__("tenant@example.com", "999999")

        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)
        self.assertFalse(otp.is_used)

    def test_verify_email_otp_expired_marks_used(self):
        otp = EmailOTP.objects.create(
            email="tenant@example.com",
            purpose=EmailOTP.PURPOSE_LOGIN,
            otp_hash=UserService._hash_email_otp("tenant@example.com", "123456"),
            expires_at=timezone.now() - timedelta(minutes=1),
            max_attempts=5,
        )

        with self.assertRaisesMessage(ValidationError, "OTP expired"):
            UserService.verify_email_otp.__wrapped__("tenant@example.com", "123456")

        otp.refresh_from_db()
        self.assertTrue(otp.is_used)

    def test_email_otp_request_api_calls_service(self):
        with patch("apps.users.views.UserService.request_email_otp") as request_mock:
            request = self.factory.post(
                "/api/v1/auth/email-otp/request/",
                {"email": "tenant@example.com"},
                format="json",
            )
            response = EmailOTPRequestAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        request_mock.assert_called_once_with(email="tenant@example.com")

    def test_email_otp_verify_api_returns_tokens(self):
        user = User(email="tenant@example.com", role="TENANT")
        tokens = AuthTokens(access="access-token", refresh="refresh-token")

        with patch(
            "apps.users.views.UserService.verify_email_otp",
            return_value=(user, tokens),
        ) as verify_mock:
            request = self.factory.post(
                "/api/v1/auth/email-otp/verify/",
                {"email": "tenant@example.com", "otp": "123456"},
                format="json",
            )
            response = EmailOTPVerifyAPIView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tokens"]["access"], "access-token")
        verify_mock.assert_called_once_with(
            email="tenant@example.com",
            otp="123456",
            role=None,
            remember_me=False,
        )
