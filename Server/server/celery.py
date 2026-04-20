import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

app = Celery("server")

app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


def parse_cron(expr: str):
    parts = expr.split()
    if len(parts) != 5:
        raise ValueError("Invalid CRON expression")

    minute, hour, day_of_month, month_of_year, day_of_week = parts

    return crontab(
        minute=minute,
        hour=hour,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        day_of_week=day_of_week,
    )


# ================================
# Celery Beat Schedule
# ================================

app.conf.beat_schedule = {
    "analytics-aggregate-daily": {
        "task": "analytics.aggregate_daily",
        "schedule": parse_cron(
            getattr(settings, "ANALYTICS_AGGREGATION_CRON", "0 2 * * *")
        ),
    },
}