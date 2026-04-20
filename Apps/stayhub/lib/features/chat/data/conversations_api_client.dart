import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.sender,
    required this.content,
    required this.createdAt,
    this.isRead = false,
  });
  final String id;
  final String sender;
  final String content;
  final DateTime createdAt;
  final bool isRead;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        sender: json['sender'] as String,
        content: json['content'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
        isRead: json['is_read'] as bool? ?? false,
      );
}

class Conversation {
  const Conversation({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    this.lastMessage,
    required this.updatedAt,
    this.unreadCount = 0,
    required this.otherUserId,
    required this.otherUserName,
  });
  final String id;
  final String propertyId;
  final String propertyTitle;
  final String? lastMessage;
  final DateTime updatedAt;
  final int unreadCount;
  final String otherUserId;
  final String otherUserName;

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: json['id'] as String,
        propertyId: (json['property'] is Map)
            ? json['property']['id'] as String
            : json['property'] as String,
        propertyTitle: (json['property'] is Map)
            ? json['property']['title'] as String
            : 'Property',
        lastMessage: (json['last_message'] as Map<String, dynamic>?)?['content']
            as String?,
        updatedAt: DateTime.parse(json['updated_at'] as String),
        unreadCount: json['unread_count'] as int? ?? 0,
        otherUserId: json['other_participant'] as String? ?? '',
        otherUserName: json['other_participant_name'] as String? ?? 'User',
      );
}

class ConversationsApiClient {
  const ConversationsApiClient(this._dio);
  final Dio _dio;

  Future<List<Conversation>> getConversations() async {
    final res = await _dio.get(ApiConstants.conversations);
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
    return list
        .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChatMessage>> getMessages(String conversationId,
      {int page = 1}) async {
    final res = await _dio.get(
      ApiConstants.messages(conversationId),
      queryParameters: {'page': page},
    );
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
    return list
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Conversation> startConversation(String propertyId) async {
    final res = await _dio.post(
      ApiConstants.conversations,
      data: {'property_id': propertyId},
    );
    return Conversation.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> markRead(String conversationId) async {
    await _dio.post(ApiConstants.markRead(conversationId));
  }
}
