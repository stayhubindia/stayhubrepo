import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../data/conversations_api_client.dart';
import '../../data/websocket_service.dart';

// ── Conversations API client ──────────────────────────────────
final conversationsApiClientProvider = Provider(
  (ref) => ConversationsApiClient(ref.read(dioProvider)),
);

// ── Conversations list ────────────────────────────────────────
final conversationsProvider =
    FutureProvider.autoDispose<List<Conversation>>((ref) async {
  return ref.read(conversationsApiClientProvider).getConversations();
});

// ── Messages for a specific conversation ─────────────────────
final messagesProvider =
    FutureProvider.autoDispose.family<List<ChatMessage>, String>(
  (ref, conversationId) async {
    return ref
        .read(conversationsApiClientProvider)
        .getMessages(conversationId);
  },
);

// ── WebSocket service (per conversation) ─────────────────────
final webSocketServiceProvider =
    Provider.autoDispose.family<WebSocketService, String>(
  (ref, conversationId) {
    final storage = ref.read(secureStorageProvider);
    final service = WebSocketService(storage: storage);
    ref.onDispose(service.dispose);
    return service;
  },
);
