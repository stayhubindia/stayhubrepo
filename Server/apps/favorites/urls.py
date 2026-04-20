from django.urls import path

from apps.favorites.views import FavoriteDeleteAPIView, FavoriteListCreateAPIView

urlpatterns = [
    path("favorites/", FavoriteListCreateAPIView.as_view(), name="favorites-list-create"),
    path("favorites/<uuid:property_id>/", FavoriteDeleteAPIView.as_view(), name="favorites-delete"),
]
