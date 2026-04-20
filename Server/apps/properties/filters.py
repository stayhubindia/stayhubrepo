import django_filters

from apps.properties.models import Property


class PropertyFilter(django_filters.FilterSet):
    min_rent = django_filters.NumberFilter(field_name="rent", lookup_expr="gte")
    max_rent = django_filters.NumberFilter(field_name="rent", lookup_expr="lte")
    available_from_before = django_filters.DateFilter(field_name="available_from", lookup_expr="lte")
    available_from_after = django_filters.DateFilter(field_name="available_from", lookup_expr="gte")
    city = django_filters.CharFilter(field_name="location__city", lookup_expr="iexact")
    state = django_filters.CharFilter(field_name="location__state", lookup_expr="iexact")
    locality = django_filters.CharFilter(field_name="location__locality", lookup_expr="icontains")
    min_bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="gte")
    max_bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="lte")
    min_bathrooms = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="gte")
    max_bathrooms = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="lte")
    min_sqft = django_filters.NumberFilter(field_name="area_sqft", lookup_expr="gte")
    max_sqft = django_filters.NumberFilter(field_name="area_sqft", lookup_expr="lte")

    class Meta:
        model = Property
        fields = [
            "property_type",
            "furnishing",
            "status",
            "preferred_tenant",
            "is_featured",
            "min_rent",
            "max_rent",
            "min_bedrooms",
            "max_bedrooms",
            "min_bathrooms",
            "max_bathrooms",
            "min_sqft",
            "max_sqft",
            "available_from_before",
            "available_from_after",
        ]
