from datetime import date, timedelta

try:
    from celery import shared_task
except ModuleNotFoundError:
    def shared_task(*dargs, **dkwargs):
        def wrapper(func):
            return func
        return wrapper

from django.db import models

from apps.analytics.models import LocationHeatmap, OwnerDashboardSnapshot, PropertyDailyAggregate
from apps.properties.models import Property


def _default_dates(target_date=None):
    today = target_date or date.today()
    yesterday = today - timedelta(days=1)
    return yesterday, today


@shared_task(name="analytics.aggregate_daily")
def aggregate_daily(target_date=None):
    agg_date, _ = _default_dates(target_date)

    # Aggregate per property
    qs = Property.objects.filter(status="ACTIVE").values("id", "owner_id", "location_id")
    bulk_property = []
    bulk_owner = {}
    bulk_location = {}

    for row in qs:
        prop_id = row["id"]
        owner_id = row["owner_id"]
        loc_id = row["location_id"]
        # For MVP we reuse cumulative counters; future: store per-day deltas
        prop = Property.objects.get(id=prop_id)
        bulk_property.append(
            PropertyDailyAggregate(
                property_id=prop_id,
                date=agg_date,
                views=prop.total_views,
                favorites=prop.total_favorites,
                contacts=prop.total_contacts,
            )
        )

        bulk_owner.setdefault(owner_id, {"views": 0, "favorites": 0, "contacts": 0})
        bulk_owner[owner_id]["views"] += prop.total_views
        bulk_owner[owner_id]["favorites"] += prop.total_favorites
        bulk_owner[owner_id]["contacts"] += prop.total_contacts

        if loc_id:
            bulk_location.setdefault(loc_id, {"views": 0, "favorites": 0, "contacts": 0})
            bulk_location[loc_id]["views"] += prop.total_views
            bulk_location[loc_id]["favorites"] += prop.total_favorites
            bulk_location[loc_id]["contacts"] += prop.total_contacts

    if bulk_property:
        PropertyDailyAggregate.objects.filter(date=agg_date).delete()
        PropertyDailyAggregate.objects.bulk_create(bulk_property, batch_size=500)

    if bulk_owner:
        OwnerDashboardSnapshot.objects.filter(date=agg_date).delete()
        OwnerDashboardSnapshot.objects.bulk_create(
            [
                OwnerDashboardSnapshot(
                    owner_id=owner_id,
                    date=agg_date,
                    total_views=vals["views"],
                    total_favorites=vals["favorites"],
                    total_contacts=vals["contacts"],
                )
                for owner_id, vals in bulk_owner.items()
            ],
            batch_size=500,
        )

    if bulk_location:
        LocationHeatmap.objects.filter(date=agg_date).delete()
        LocationHeatmap.objects.bulk_create(
            [
                LocationHeatmap(
                    location_id=loc_id,
                    date=agg_date,
                    views=vals["views"],
                    favorites=vals["favorites"],
                    contacts=vals["contacts"],
                )
                for loc_id, vals in bulk_location.items()
            ],
            batch_size=500,
        )

    return {
        "properties": len(bulk_property),
        "owners": len(bulk_owner),
        "locations": len(bulk_location),
        "date": str(agg_date),
    }
