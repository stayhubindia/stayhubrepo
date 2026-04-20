from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import (
    EmailOTPRequestAPIView,
    EmailOTPVerifyAPIView,
    FirebaseLoginAPIView,
    LinkFirebaseAPIView,
    MeAPIView,
)

urlpatterns = [
    path("auth/firebase/login/", FirebaseLoginAPIView.as_view(), name="firebase-login"),
    path("auth/firebase/link/", LinkFirebaseAPIView.as_view(), name="firebase-link"),
    path("auth/email-otp/request/", EmailOTPRequestAPIView.as_view(), name="email-otp-request"),
    path("auth/email-otp/verify/", EmailOTPVerifyAPIView.as_view(), name="email-otp-verify"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("users/me/", MeAPIView.as_view(), name="users-me"),
]
