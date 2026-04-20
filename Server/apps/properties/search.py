from django.db.models import Q


def apply_search(queryset, term: str):
    if not term:
        return queryset
    term = term.strip()
    return queryset.filter(
        Q(title__icontains=term)
        | Q(description__icontains=term)
        | Q(location__city__icontains=term)
        | Q(location__locality__icontains=term)
        | Q(location__address__icontains=term)
    )
