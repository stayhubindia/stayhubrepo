from rest_framework.throttling import UserRateThrottle


class PropertyReadThrottle(UserRateThrottle):
    scope = "property_read"


class PropertyWriteThrottle(UserRateThrottle):
    scope = "property_write"
