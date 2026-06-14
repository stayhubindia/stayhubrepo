import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../data/conversations_api_client.dart';
import '../../data/websocket_service.dart';
import '../../data/global_websocket_service.dart';

// ── Conversations API client ──────────────────────────────────
final conversationsApiClientProvider = Provider(
  (ref) => ConversationsApiClient(ref.read(dioProvider)),
);

// ── Global WebSocket service ───────────────────────────────────
final globalWebSocketServiceProvider = Provider<GlobalWebSocketService>((ref) {
  final storage = ref.read(secureStorageProvider);
  final service = GlobalWebSocketService(storage: storage);
  
  // We don't connect immediately here. Connect when needed (e.g., when the user logs in
  // or when the conversations provider is watched).
  ref.onDispose(() {
    service.dispose();
  });
  return service;
});

// ── Conversations list ────────────────────────────────────────
class ConversationsNotifier extends AsyncNotifier<List<Conversation>> {
  @override
  Future<List<Conversation>> build() async {
    // Connect global WS when watching conversations
    final globalWs = ref.read(globalWebSocketServiceProvider);
    globalWs.connect();
    
    // Listen for updates
    final sub = globalWs.stream.listen((msg) {
      if (msg.type == GlobalWsMessageType.conversationUpdated && msg.payload != null) {
        final convData = msg.payload!['conversation'] as Map<String, dynamic>?;
        if (convData != null) {
          final updatedConv = Conversation.fromJson(convData);
          _updateConversationInList(updatedConv);
        }
      }
    });
    
    ref.onDispose(() {
      sub.cancel();
      globalWs.disconnect();
    });

    return ref.read(conversationsApiClientProvider).getConversations();
  }
  
  void _updateConversationInList(Conversation updatedConv) {
    state.whenData((conversations) {
      final newList = List<Conversation>.from(conversations);
      final idx = newList.indexWhere((c) => c.id == updatedConv.id);
      if (idx != -1) {
        newList[idx] = updatedConv;
      } else {
        newList.insert(0, updatedConv); // New conversation
      }
      
      // Sort by updatedAt descending
      newList.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      state = AsyncData(newList);
    });
  }
}

final conversationsProvider =
    AsyncNotifierProvider<ConversationsNotifier, List<Conversation>>(
  () => ConversationsNotifier(),
);

// ── Messages for a specific conversation (kept simple for now) ──
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
