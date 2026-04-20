try:
    from celery import shared_task
except ModuleNotFoundError:  # Celery optional in some environments
    def shared_task(*dargs, **dkwargs):
        def wrapper(func):
            return func
        return wrapper

from apps.notifications.models import Notification
from apps.users.models import User


@shared_task(name="notifications.send")
def send_notification_task(recipient_id, notification_type, title, message, reference_id=None):
    recipient = User.objects.filter(id=recipient_id).first()
    if recipient is None:
        return None
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        reference_id=reference_id,
    )
