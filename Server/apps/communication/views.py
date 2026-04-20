from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.communication.serializers import (
    ConversationCreateSerializer,
    ConversationSerializer,
    MessageSendSerializer,
    MessageSerializer,
)
from apps.communication.services import CommunicationService
from apps.communication.throttles import MessageSendThrottle


class ConversationListCreateAPIView(APIView):
    @extend_schema(responses={200: ConversationSerializer(many=True)})
    def get(self, request):
        conversations = CommunicationService.list_conversations(request.user)
        return Response(ConversationSerializer(conversations, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(request=ConversationCreateSerializer, responses={200: ConversationSerializer, 201: ConversationSerializer})
    def post(self, request):
        serializer = ConversationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation, created = CommunicationService.get_or_create_conversation_for_tenant(
            actor=request.user,
            property_id=serializer.validated_data["property_id"],
        )
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(ConversationSerializer(conversation).data, status=status_code)


class ConversationMessageListCreateAPIView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    throttle_classes = [MessageSendThrottle]

    @extend_schema(responses={200: MessageSerializer(many=True)})
    def get(self, request, conversation_id):
        conversation = CommunicationService.get_conversation_for_user(conversation_id, request.user)
        messages = CommunicationService.list_messages(conversation, request.user)
        return Response(MessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(request=MessageSendSerializer, responses={201: MessageSerializer})
    def post(self, request, conversation_id):
        serializer = MessageSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation = CommunicationService.get_conversation_for_user(conversation_id, request.user)
        message = CommunicationService.send_text_message(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data.get("content"),
            image=serializer.validated_data.get("image"),
        )
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class ConversationMarkReadAPIView(APIView):
    @extend_schema(request=None, responses={200: OpenApiResponse(description="Updated message count")})
    def post(self, request, conversation_id):
        conversation = CommunicationService.get_conversation_for_user(conversation_id, request.user)
        updated_count = CommunicationService.mark_read(conversation, request.user)
        return Response({"updated": updated_count}, status=status.HTTP_200_OK)


class ConversationArchiveAPIView(APIView):
    @extend_schema(request=None, responses={200: ConversationSerializer})
    def post(self, request, conversation_id):
        conversation = CommunicationService.get_conversation_for_user(conversation_id, request.user)
        conversation = CommunicationService.archive_conversation(conversation, request.user)
        return Response(ConversationSerializer(conversation).data, status=status.HTTP_200_OK)
