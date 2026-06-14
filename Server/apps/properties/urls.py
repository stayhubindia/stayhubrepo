from rest_framework.routers import DefaultRouter

from apps.properties.views import AmenityViewSet, PropertyViewSet

router = DefaultRouter()
router.register("properties", PropertyViewSet, basename="properties")
router.register("amenities", AmenityViewSet, basename="amenities")

urlpatterns = router.urls
