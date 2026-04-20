try:
    from celery import shared_task
except ModuleNotFoundError:
    def shared_task(*dargs, **dkwargs):
        def wrapper(func):
            return func
        return wrapper

from django.db import models

from apps.properties.models import Property


@shared_task(name="properties.increment_views")
def increment_property_views(property_id):
    return Property.objects.filter(id=property_id).update(total_views=models.F("total_views") + 1)
