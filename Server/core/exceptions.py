from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # In DEBUG mode, re-raise to see full traceback
        from django.conf import settings
        if settings.DEBUG:
            raise exc
        return Response(
            {"error": {"code": "server_error", "detail": "Internal server error"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    if isinstance(detail, dict) and "detail" in detail:
        payload = detail["detail"]
    else:
        payload = detail

    return Response(
        {"error": {"code": "request_error", "detail": payload}},
        status=response.status_code,
    )
