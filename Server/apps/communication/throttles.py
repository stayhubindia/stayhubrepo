from rest_framework.throttling import UserRateThrottle


class MessageSendThrottle(UserRateThrottle):
    scope = "message_send"

    def allow_request(self, request, view):
        if request.method != "POST":
            return True
        return super().allow_request(request, view)
