import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/global_websocket_service.dart';
import '../../data/conversations_api_client.dart';
import 'chat_provider.dart';

final globalNotificationProvider = Provider<void>((ref) {
  final globalWs = ref.watch(globalWebSocketServiceProvider);
  final authState = ref.watch(authProvider);

  if (authState is! AuthAuthenticated) return;
  final currentUserId = authState.user.id;

  // Ensure the WebSocket connects
  globalWs.connect();

  // Keep track of the unread count per conversation to detect increments
  final Map<String, int> previousUnreadCounts = {};

  final sub = globalWs.stream.listen((msg) {
    if (msg.type == GlobalWsMessageType.conversationUpdated && msg.payload != null) {
      final convData = msg.payload!['conversation'] as Map<String, dynamic>?;
      if (convData == null) return;

      final updatedConv = Conversation.fromJson(convData);
      final newUnreadCount = updatedConv.getUnreadCount(currentUserId);
      final oldUnreadCount = previousUnreadCounts[updatedConv.id] ?? 0;

      // Update the cache
      previousUnreadCounts[updatedConv.id] = newUnreadCount;

      // If the unread count increased, we have a new message!
      if (newUnreadCount > oldUnreadCount) {
        _showNotificationBanner(updatedConv, ref, currentUserId);
      }
    }
  });

  ref.onDispose(() {
    sub.cancel();
  });
});

void _showNotificationBanner(Conversation conv, Ref ref, String currentUserId) {
  final router = ref.read(routerProvider);
  final currentPath = router.routerDelegate.currentConfiguration.uri.path;
  
  // Don't show the banner if we are currently looking at this specific chat
  if (currentPath == '/chats/${conv.id}') {
    return;
  }

  final overlayState = router.routerDelegate.navigatorKey.currentState?.overlay;
  if (overlayState == null) {
    debugPrint('[Notification] OverlayState is null');
    return;
  }

  final isOwner = currentUserId == conv.owner?['id'];
  final senderData = isOwner ? conv.tenant : conv.owner;
  final senderName = senderData?['first_name']?.isNotEmpty == true
      ? senderData!['first_name']
      : 'User';
  final senderInitial = senderName.isNotEmpty ? senderName[0].toUpperCase() : '?';

  OverlayEntry? entry;

  entry = OverlayEntry(
    builder: (context) {
      return Positioned(
        top: MediaQuery.of(context).padding.top + 12,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 500),
            curve: Curves.elasticOut,
            tween: Tween(begin: -100.0, end: 0.0),
            builder: (context, value, child) {
              return Transform.translate(
                offset: Offset(0, value),
                child: child,
              );
            },
            child: GestureDetector(
              onTap: () {
                if (entry?.mounted == true) entry?.remove();
                router.push('/chats/${conv.id}', extra: {
                  'title': conv.propertyTitle,
                  'propertyId': conv.propertyId,
                  'propertyTitle': conv.propertyTitle,
                });
              },
              onVerticalDragEnd: (details) {
                if (details.primaryVelocity != null && details.primaryVelocity! < 0) {
                  if (entry?.mounted == true) entry?.remove();
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                      child: Text(
                        senderInitial,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                senderName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '• ${conv.propertyTitle}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textHint,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          if (conv.lastMessage != null && conv.lastMessage!.isNotEmpty)
                            Text(
                              conv.lastMessage!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        if (entry?.mounted == true) entry?.remove();
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          size: 16,
                          color: AppColors.textHint,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    },
  );

  overlayState.insert(entry);

  // Auto-dismiss the banner after 5 seconds
  Future.delayed(const Duration(seconds: 5), () {
    if (entry?.mounted == true) {
      entry?.remove();
    }
  });
}
