from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError


class ServiceGuards:
    @staticmethod
    def ensure_role(user, allowed_roles, message="Unauthorized role"):
        if user.role not in set(allowed_roles):
            raise PermissionDenied(message)

    @staticmethod
    def ensure_owner_or_staff(resource, actor, owner_id_attr="owner_id", message="Unauthorized"):
        owner_id = getattr(resource, owner_id_attr, None)
        is_staff = bool(getattr(actor, "is_staff", False))
        actor_id = getattr(actor, "id", None)
        if not is_staff and owner_id != actor_id:
            raise PermissionDenied(message)

    @staticmethod
    def ensure_status(current_status, allowed_statuses, message):
        if current_status not in set(allowed_statuses):
            raise ValidationError(message)
