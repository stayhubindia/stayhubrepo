import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.notificationType,
    required this.isRead,
    required this.createdAt,
    this.relatedPropertyId,
    this.relatedConversationId,
  });

  final String id;
  final String title;
  final String message;
  final String notificationType; // CONTACT | MESSAGE | SYSTEM | PROPERTY_STATUS
  final bool isRead;
  final DateTime createdAt;
  final String? relatedPropertyId;
  final String? relatedConversationId;

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        message: json['message'] as String? ?? '',
        notificationType:
            json['notification_type'] as String? ?? 'SYSTEM',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: DateTime.parse(json['created_at'] as String),
        relatedPropertyId: json['related_property'] as String?,
        relatedConversationId: json['related_conversation'] as String?,
      );

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        title: title,
        message: message,
        notificationType: notificationType,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
        relatedPropertyId: relatedPropertyId,
        relatedConversationId: relatedConversationId,
      );
}

class NotificationsApiClient {
  const NotificationsApiClient(this._dio);
  final Dio _dio;

  /// GET /api/v1/notifications/
  /// Optional query param: ?unread=true
  Future<List<AppNotification>> getNotifications({
    bool unreadOnly = false,
  }) async {
    final res = await _dio.get(
      ApiConstants.notifications,
      queryParameters: unreadOnly ? {'unread': 'true'} : null,
    );
    final data = res.data;
    final list = data is List
        ? data
        : (data as Map<String, dynamic>)['results'] as List<dynamic>? ?? [];
    return list
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/v1/notifications/unread-count/
  Future<int> getUnreadCount() async {
    final res = await _dio.get(ApiConstants.notificationsUnreadCount);
    final data = res.data as Map<String, dynamic>;
    final v = data['unread_count'];
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v?.toString() ?? '0') ?? 0;
  }

  /// POST /api/v1/notifications/{id}/read/
  Future<void> markRead(String id) async {
    await _dio.post(ApiConstants.notificationMarkRead(id));
  }

  /// POST /api/v1/notifications/mark-all-read/
  Future<void> markAllRead() async {
    await _dio.post(ApiConstants.notificationsMarkAllRead);
  }
}
