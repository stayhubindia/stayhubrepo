from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from core.throttles import AuthRateThrottle
from apps.users.serializers import (
    EmailOTPRequestSerializer,
    EmailOTPVerifySerializer,
    FirebaseLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)
from apps.users.services import UserService, FirebaseAuthError


class FirebaseLoginAPIView(APIView):
    throttle_classes = [AuthRateThrottle]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FirebaseLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, tokens = UserService.login_with_firebase(
                firebase_token=serializer.validated_data["firebase_token"],
                role=serializer.validated_data.get("role"),
                remember_me=serializer.validated_data.get("remember_me", False),
            )
        except PermissionDenied as e:
            error_msg = str(e) if str(e) else "Permission denied"
            return Response({"detail": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            if hasattr(e, 'detail'):
                if isinstance(e.detail, str):
                    error_msg = e.detail
                elif isinstance(e.detail, list) and e.detail:
                    error_msg = str(e.detail[0])
                elif isinstance(e.detail, dict):
                    error_msg = str(list(e.detail.values())[0][0]) if e.detail else str(e)
                else:
                    error_msg = str(e.detail)
            else:
                error_msg = str(e)
            return Response({"detail": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except FirebaseAuthError as e:
            error_msg = str(e.detail) if hasattr(e, 'detail') else str(e)
            return Response({"detail": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "user": UserProfileSerializer(user).data,
                "tokens": {"access": tokens.access, "refresh": tokens.refresh},
            },
            status=status.HTTP_200_OK,
        )


class EmailOTPRequestAPIView(APIView):
    throttle_classes = [AuthRateThrottle]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserService.request_email_otp(email=serializer.validated_data["email"])
        return Response({"detail": "OTP sent to email"}, status=status.HTTP_200_OK)


class EmailOTPVerifyAPIView(APIView):
    throttle_classes = [AuthRateThrottle]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user, tokens = UserService.verify_email_otp(
                email=serializer.validated_data["email"],
                otp=serializer.validated_data["otp"],
                role=serializer.validated_data.get("role"),
                remember_me=serializer.validated_data.get("remember_me", False),
            )
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {
                "user": UserProfileSerializer(user).data,
                "tokens": {"access": tokens.access, "refresh": tokens.refresh},
            },
            status=status.HTTP_200_OK,
        )


class MeAPIView(APIView):
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = UserService.update_profile(request.user, serializer.validated_data)
        return Response(UserProfileSerializer(user).data, status=status.HTTP_200_OK)


class LinkFirebaseAPIView(APIView):
    """Link a Google/Firebase account to the authenticated user."""
    throttle_classes = [AuthRateThrottle]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        firebase_token = request.data.get("firebase_token")
        if not firebase_token:
            return Response(
                {"detail": "firebase_token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = UserService.link_firebase_account(request.user, firebase_token)
        except (ValidationError, FirebaseAuthError) as e:
            error_msg = str(e.detail) if hasattr(e, "detail") else str(e)
            return Response({"detail": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Google account linked successfully", "user": UserProfileSerializer(user).data},
            status=status.HTTP_200_OK,
        )
