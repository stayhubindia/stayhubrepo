import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is double) return v.toInt();
  return int.tryParse(v.toString()) ?? 0;
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.sender,
    required this.senderName,
    required this.content,
    required this.createdAt,
    this.clientId,
    this.messageType = 'TEXT',
    this.audioUrl,
    this.isRead = false,
  });

  final String id;
  final String? clientId;
  final String sender;     // sender user UUID
  final String senderName; // display name
  final String content;
  final String messageType;
  final String? audioUrl;
  final DateTime createdAt;
  final bool isRead;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    // sender can be a plain String UUID or a full user object
    final senderRaw = json['sender'];
    final String senderId;
    final String senderName;

    if (senderRaw is Map<String, dynamic>) {
      senderId = senderRaw['id'] as String? ?? '';
      final first = senderRaw['first_name'] as String? ?? '';
      final last = senderRaw['last_name'] as String? ?? '';
      senderName = '$first $last'.trim().isNotEmpty
          ? '$first $last'.trim()
          : senderRaw['email'] as String? ?? 'User';
    } else {
      senderId = senderRaw as String? ?? '';
      senderName = '';
    }

    return ChatMessage(
      id: json['id'] as String,
      sender: senderId,
      senderName: senderName,
      content: json['content'] as String? ?? '',
      messageType: json['message_type'] as String? ?? 'TEXT',
      audioUrl: json['audio'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      clientId: json['client_id'] as String?,
      isRead: json['is_read'] as bool? ?? false,
    );
  }
}

class Conversation {
  const Conversation({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    this.lastMessage,
    required this.updatedAt,
    this.ownerUnreadCount = 0,
    this.tenantUnreadCount = 0,
    this.tenant,
    this.owner,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String? lastMessage;
  final DateTime updatedAt;
  final int ownerUnreadCount;
  final int tenantUnreadCount;
  final Map<String, dynamic>? tenant;
  final Map<String, dynamic>? owner;

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: json['id'] as String,
        propertyId: (json['property'] is Map)
            ? json['property']['id'] as String
            : json['property'] as String,
        propertyTitle: (json['property'] is Map)
            ? json['property']['title'] as String? ?? 'Property'
            : 'Property',
        lastMessage:
            (json['last_message'] as Map<String, dynamic>?)?['content']
                as String?,
        updatedAt: DateTime.parse(json['updated_at'] as String),
        ownerUnreadCount: _toInt(json['owner_unread_count']),
        tenantUnreadCount: _toInt(json['tenant_unread_count']),
        tenant: json['tenant'] as Map<String, dynamic>?,
        owner: json['owner'] as Map<String, dynamic>?,
      );

  int getUnreadCount(String currentUserId) {
    if (owner != null && owner!['id'] == currentUserId) {
      return ownerUnreadCount;
    }
    if (tenant != null && tenant!['id'] == currentUserId) {
      return tenantUnreadCount;
    }
    return 0;
  }
}

class ConversationsApiClient {
  const ConversationsApiClient(this._dio);
  final Dio _dio;

  /// GET /api/v1/communication/conversations/
  Future<List<Conversation>> getConversations() async {
    final res = await _dio.get(ApiConstants.conversations);
    final data = res.data;
    final list = data is List
        ? data
        : (data as Map<String, dynamic>)['results'] as List<dynamic>? ?? [];
    return list
        .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/v1/communication/conversations/{id}/messages/
  Future<List<ChatMessage>> getMessages(
    String conversationId, {
    int page = 1,
  }) async {
    final res = await _dio.get(
      ApiConstants.messages(conversationId),
      queryParameters: {'page': page},
    );
    final data = res.data;
    final list = data is List
        ? data
        : (data as Map<String, dynamic>)['results'] as List<dynamic>? ?? [];
    return list
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/v1/communication/conversations/{id}/messages/
  /// Send a message via REST API (fallback when WebSocket is not connected)
  Future<ChatMessage> sendMessage(
      String conversationId, String content, {String? clientId, String? audioFilePath}) async {
    
    dynamic data;
    if (audioFilePath != null) {
      data = FormData.fromMap({
        if (content.isNotEmpty) 'content': content,
        if (clientId != null) 'client_id': clientId,
        'audio': await MultipartFile.fromFile(audioFilePath),
      });
    } else {
      final mapData = <String, dynamic>{'content': content};
      if (clientId != null) mapData['client_id'] = clientId;
      data = mapData;
    }
    
    final res = await _dio.post(
      ApiConstants.messages(conversationId),
      data: data,
    );
    return ChatMessage.fromJson(res.data as Map<String, dynamic>);
  }

  /// POST /api/v1/communication/conversations/
  /// Body: `{ "property_id": "<uuid>" }`
  /// Returns existing conversation if one already exists (200) or creates new (201).
  Future<Conversation> startConversation(String propertyId) async {
    final res = await _dio.post(
      ApiConstants.conversations,
      data: {'property_id': propertyId},
    );
    return Conversation.fromJson(res.data as Map<String, dynamic>);
  }

  /// POST /api/v1/communication/conversations/{id}/read/
  Future<void> markRead(String conversationId) async {
    await _dio.post(ApiConstants.markRead(conversationId));
  }

  /// POST /api/v1/communication/conversations/{id}/archive/
  Future<void> archiveConversation(String conversationId) async {
    await _dio.post(ApiConstants.archiveConversation(conversationId));
  }
}
