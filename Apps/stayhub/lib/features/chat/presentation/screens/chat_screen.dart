import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/conversations_api_client.dart';
import '../../data/websocket_service.dart';
import '../providers/chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    super.key,
    required this.conversationId,
    this.otherUserName = 'Chat',
  });

  final String conversationId;
  final String otherUserName;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<ChatMessage> _messages = [];
  StreamSubscription<WsMessage>? _wsSub;
  bool _isTyping = false;
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    // Get current user id from auth state
    final authState = ref.read(authProvider);
    if (authState is AuthAuthenticated) {
      _currentUserId = authState.user.id;
    }
    _loadMessages();
    _connectWs();
  }

  Future<void> _loadMessages() async {
    try {
      final msgs = await ref
          .read(conversationsApiClientProvider)
          .getMessages(widget.conversationId);
      if (mounted) {
        setState(() {
          _messages.addAll(msgs.reversed);
        });
        _scrollToBottom();
        ref
            .read(conversationsApiClientProvider)
            .markRead(widget.conversationId)
            .ignore();
      }
    } catch (_) {}
  }

  void _connectWs() {
    final service = ref.read(webSocketServiceProvider(widget.conversationId));
    service.connect(widget.conversationId);
    _wsSub = service.stream.listen(_onWsMessage);
  }

  void _onWsMessage(WsMessage msg) {
    if (msg.type == WsMessageType.chatMessage && msg.payload != null) {
      final chatMsg = ChatMessage.fromJson(msg.payload!);
      if (mounted) {
        setState(() => _messages.add(chatMsg));
        _scrollToBottom();
      }
    } else if (msg.type == WsMessageType.typing) {
      if (mounted) {
        setState(() => _isTyping = true);
        Future.delayed(const Duration(seconds: 3),
            () => mounted ? setState(() => _isTyping = false) : null);
      }
    }
  }

  void _send() {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty) return;
    final service = ref.read(webSocketServiceProvider(widget.conversationId));
    service.sendMessage(text);
    _inputCtrl.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // We don't have currentUser id here easily, so compare by checking
    // if it's "me" via a simple heuristic — use a placeholder for now.
    // In production, watch authProvider and compare sender to current user id.

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherUserName),
            if (_isTyping)
              const Text('typing…',
                  style: TextStyle(fontSize: 12, color: Colors.white70)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? const Center(
                    child: Text('Send a message to start the conversation',
                        style: TextStyle(color: AppColors.textHint)),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) => _MessageBubble(
                      message: _messages[i],
                      isMe: _messages[i].sender == _currentUserId,
                    ),
                  ),
          ),
          const Divider(height: 1),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputCtrl,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: 'Type a message…',
                        filled: true,
                        fillColor: AppColors.surfaceVariant,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: IconButton(
                      onPressed: _send,
                      icon: const Icon(Icons.send_rounded,
                          color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.isMe});
  final ChatMessage message;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        margin: const EdgeInsets.only(bottom: 8),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surfaceVariant,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : AppColors.textPrimary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('h:mm a').format(message.createdAt.toLocal()),
              style: TextStyle(
                fontSize: 11,
                color: isMe
                    ? Colors.white60
                    : AppColors.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
