from celery import shared_task

from apps.users.services import UserService


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_jitter=True, max_retries=5)
def send_email_otp_task(self, to_email: str, otp: str, ttl_minutes: int) -> None:
    """Send OTP email asynchronously via Brevo."""
    UserService._send_email_via_brevo(to_email=to_email, otp=otp, ttl_minutes=ttl_minutes)
