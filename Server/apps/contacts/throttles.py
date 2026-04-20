from rest_framework.throttling import UserRateThrottle


class ContactCreateThrottle(UserRateThrottle):
    scope = "contact_create"
