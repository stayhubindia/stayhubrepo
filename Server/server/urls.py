from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def api_health(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("api/v1/health/", api_health),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.properties.urls")),
    path("api/v1/", include("apps.favorites.urls")),
    path("api/v1/", include("apps.contacts.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.communication.urls")),
    path("api/v1/", include("apps.analytics.urls")),

]
