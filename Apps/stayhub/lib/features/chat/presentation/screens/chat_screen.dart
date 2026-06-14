import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'dart:io';
import 'package:audioplayers/audioplayers.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
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
    this.propertyId,
    this.propertyTitle,
    this.propertyRent,
    this.propertyImage,
    this.propertyCity,
  });

  final String conversationId;
  final String otherUserName;
  final String? propertyId;
  final String? propertyTitle;
  final double? propertyRent;
  final String? propertyImage;
  final String? propertyCity;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputCtrl = TextEditingController();
  final _focusNode = FocusNode();
  final _scrollCtrl = ScrollController();
  final List<ChatMessage> _messages = [];
  StreamSubscription<WsMessage>? _wsSub;
  bool _isTyping = false;
  String? _currentUserId;
  String? _currentUserRole;
  Timer? _typingDebounce;
  bool _isMeTyping = false;
  bool _showPropertyCard = true;
  bool _showEmoji = false;
  int _unreadCount = 0;
  bool _isAtBottom = true;
  
  // Audio recording state
  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;
  String? _recordFilePath;
  Timer? _recordTimer;
  int _recordDuration = 0;
  String? _pendingAudioPath;
  int _pendingAudioDuration = 0;

  // Quick reply suggestions
  static const _quickReplies = [
    (icon: Icons.check_box_outlined, label: 'Is it available?'),
    (icon: Icons.calendar_today_outlined, label: 'Schedule Visit'),
    (icon: Icons.photo_outlined, label: 'Can I get more photos?'),
    (icon: Icons.currency_rupee_outlined, label: 'Is rent negotiable?'),
  ];

  @override
  void initState() {
    super.initState();
    final authState = ref.read(authProvider);
    if (authState is AuthAuthenticated) {
      _currentUserId = authState.user.id;
      _currentUserRole = authState.user.role;
    }
    _loadMessages();
    _connectWs();
    _inputCtrl.addListener(_onTextChanged);
    _focusNode.addListener(() {
      if (_focusNode.hasFocus && _showEmoji) {
        setState(() => _showEmoji = false);
      }
    });
    _scrollCtrl.addListener(_onScroll);
  }

  void _onScroll() {
    if (!_scrollCtrl.hasClients) return;
    
    final isAtBottom = _scrollCtrl.position.maxScrollExtent - _scrollCtrl.position.pixels <= 100;
    
    if (isAtBottom != _isAtBottom) {
      setState(() {
        _isAtBottom = isAtBottom;
        if (_isAtBottom && _unreadCount > 0) {
          _unreadCount = 0;
          ref.read(webSocketServiceProvider(widget.conversationId)).markAsRead();
        }
      });
    }
  }

  void _onTextChanged() {
    setState(() {}); // rebuild to show/hide send button
    final service =
        ref.read(webSocketServiceProvider(widget.conversationId));
    if (_inputCtrl.text.isNotEmpty) {
      if (!_isMeTyping) {
        _isMeTyping = true;
        service.sendTyping(true);
      }
      _typingDebounce?.cancel();
      _typingDebounce = Timer(const Duration(seconds: 2), () {
        _isMeTyping = false;
        if (mounted) service.sendTyping(false);
      });
    } else {
      if (_isMeTyping) {
        _isMeTyping = false;
        service.sendTyping(false);
      }
      _typingDebounce?.cancel();
    }
  }

  Future<void> _loadMessages() async {
    try {
      final msgs = await ref
          .read(conversationsApiClientProvider)
          .getMessages(widget.conversationId);
      if (mounted) {
        final unreadMsgs = msgs.where((m) => !m.isRead && m.sender != _currentUserId).toList();
        setState(() {
          _messages.addAll(msgs);
          _unreadCount = unreadMsgs.length;
        });

        if (_unreadCount > 0) {
          setState(() => _isAtBottom = false);
          // Estimate scroll position of first unread message
          final firstUnreadIdx = msgs.indexWhere((m) => !m.isRead && m.sender != _currentUserId);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollCtrl.hasClients) {
              double offset = firstUnreadIdx * 75.0; // Estimated message height
              final maxScroll = _scrollCtrl.position.maxScrollExtent;
              // Ensure we don't scroll past the max, and stay at least 150px away from bottom so FAB shows
              if (offset > maxScroll - 150) {
                offset = maxScroll - 150;
              }
              if (offset < 0) offset = 0;
              _scrollCtrl.jumpTo(offset);
            }
          });
        } else {
          _scrollToBottom();
          ref
              .read(conversationsApiClientProvider)
              .markRead(widget.conversationId)
              .ignore();
        }
      }
    } catch (_) {}
  }

  void _connectWs() {
    final service =
        ref.read(webSocketServiceProvider(widget.conversationId));
    service.connect(widget.conversationId);
    _wsSub = service.stream.listen(_onWsMessage);
  }

  void _onWsMessage(WsMessage msg) {
    if (msg.type == WsMessageType.chatMessage && msg.payload != null) {
      final data = msg.payload!['message'] as Map<String, dynamic>?;
      if (data != null && mounted) {
        final incoming = ChatMessage.fromJson(data);
        // Skip if this is an echo of our own optimistic message
        final incomingClientId = incoming.clientId;
        final isDuplicate = _messages.any((m) =>
            m.clientId != null && m.clientId == incomingClientId);
        if (isDuplicate) {
          // Replace the optimistic message with the real one from server
          setState(() {
            final idx = _messages.indexWhere((m) => m.clientId == incomingClientId);
            if (idx != -1) _messages[idx] = incoming;
          });
        } else {
          setState(() {
            _messages.add(incoming);
            if (!_isAtBottom && incoming.sender != _currentUserId) {
              _unreadCount++;
            }
          });
          
          if (_isAtBottom || incoming.sender == _currentUserId) {
            _scrollToBottom();
            if (incoming.sender != _currentUserId) {
              ref.read(webSocketServiceProvider(widget.conversationId)).markAsRead();
            }
          }
        }
      }
    } else if (msg.type == WsMessageType.error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg.payload?['detail'] ?? 'An error occurred'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() {
            _messages.removeWhere((m) => m.id.startsWith('local_') && !m.isRead); // basic rollback
        });
      }
    } else if (msg.type == WsMessageType.read) {
      if (mounted) {
        final userId = msg.payload?['user_id'] as String?;
        if (userId != null && userId != _currentUserId) {
          setState(() {
            for (var i = 0; i < _messages.length; i++) {
              if (_messages[i].sender == _currentUserId && !_messages[i].isRead) {
                _messages[i] = ChatMessage(
                  id: _messages[i].id,
                  sender: _messages[i].sender,
                  senderName: _messages[i].senderName,
                  content: _messages[i].content,
                  createdAt: _messages[i].createdAt,
                  isRead: true,
                );
              }
            }
          });
        }
      }
    } else if (msg.type == WsMessageType.typing) {
      if (msg.payload?['user_id'] != _currentUserId && mounted) {
        final typing = msg.payload!['is_typing'] as bool? ?? false;
        setState(() => _isTyping = typing);
        if (typing) {
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) setState(() => _isTyping = false);
          });
        }
      }
    }
  }

  String _generateUuidV4() {
    final rnd = Random();
    String hex(int max) => rnd.nextInt(max).toRadixString(16).padLeft(1, '0');
    return '${hex(65536).padLeft(4, '0')}${hex(65536).padLeft(4, '0')}-'
        '${hex(65536).padLeft(4, '0')}-4${hex(4096).padLeft(3, '0')}-'
        '${(rnd.nextInt(4) + 8).toRadixString(16)}${hex(4096).padLeft(3, '0')}-'
        '${hex(65536).padLeft(4, '0')}${hex(65536).padLeft(4, '0')}${hex(65536).padLeft(4, '0')}';
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final dir = await getApplicationDocumentsDirectory();
        final filePath = '${dir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(const RecordConfig(), path: filePath);
        
        setState(() {
          _isRecording = true;
          _recordFilePath = filePath;
          _recordDuration = 0;
        });

        _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          setState(() => _recordDuration++);
        });
      }
    } catch (e) {
      debugPrint('Error starting record: $e');
    }
  }

  Future<void> _stopRecording() async {
    _recordTimer?.cancel();
    final path = await _audioRecorder.stop();
    setState(() {
      _isRecording = false;
      if (path != null && _recordDuration > 0) {
        _pendingAudioPath = path;
        _pendingAudioDuration = _recordDuration;
      }
    });
  }

  void _sendPendingAudio() {
    if (_pendingAudioPath != null) {
      _sendAudio(_pendingAudioPath!);
      setState(() {
        _pendingAudioPath = null;
        _pendingAudioDuration = 0;
      });
    }
  }

  void _cancelPendingAudio() {
    setState(() {
      _pendingAudioPath = null;
      _pendingAudioDuration = 0;
    });
  }

  void _sendAudio(String path) {
    final clientId = _generateUuidV4();
    final optimisticMsg = ChatMessage(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      sender: _currentUserId ?? '',
      senderName: '',
      content: 'Audio message',
      messageType: 'AUDIO',
      audioUrl: path,
      createdAt: DateTime.now(),
      clientId: clientId,
      isRead: false,
    );
    setState(() => _messages.add(optimisticMsg));
    _scrollToBottom();
    _sendViaRest('', clientId, optimisticMsg.id, audioFilePath: path);
  }

  void _send([String? quickText]) {
    final text = quickText ?? _inputCtrl.text.trim();
    if (text.isEmpty) return;

    final clientId = _generateUuidV4();

    // Optimistically add the message to the list immediately
    final optimisticMsg = ChatMessage(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      sender: _currentUserId ?? '',
      senderName: '',
      content: text,
      createdAt: DateTime.now(),
      clientId: clientId,
      isRead: false,
    );
    setState(() => _messages.add(optimisticMsg));
    if (quickText == null) _inputCtrl.clear();
    _scrollToBottom();

    // Try WebSocket first, fall back to REST API
    final service =
        ref.read(webSocketServiceProvider(widget.conversationId));
    if (service.isConnected) {
      service.sendMessage(text, clientId: clientId);
      _isMeTyping = false;
      service.sendTyping(false);
    } else {
      // WebSocket not connected — send via REST API
      _sendViaRest(text, clientId, optimisticMsg.id);
    }
  }

  Future<void> _sendViaRest(String text, String clientId, String localId, {String? audioFilePath}) async {
    try {
      final realMsg = await ref
          .read(conversationsApiClientProvider)
          .sendMessage(widget.conversationId, text, clientId: clientId, audioFilePath: audioFilePath);
      if (mounted) {
        setState(() {
          final idx = _messages.indexWhere((m) => m.id == localId);
          if (idx != -1) _messages[idx] = realMsg;
        });
      }
    } catch (e) {
      debugPrint('[Chat] REST send failed: $e');
      if (mounted) {
        setState(() => _messages.removeWhere((m) => m.id == localId));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to send message'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
    _typingDebounce?.cancel();
    _inputCtrl.dispose();
    _focusNode.dispose();
    _scrollCtrl.dispose();
    _audioRecorder.dispose();
    _recordTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Keep websocket alive
    ref.watch(webSocketServiceProvider(widget.conversationId));

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FA),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8FAFC), Color(0xFFEFF3F8)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── App bar ──────────────────────────────────────────
              _ChatAppBar(
                otherUserName: widget.otherUserName,
                isTyping: _isTyping,
                currentUserRole: _currentUserRole,
                propertyTitle: widget.propertyTitle,
                onBack: () => context.pop(),
              ),

              // ── Property card (Floating) ──────────────────────────
              if (widget.propertyTitle != null && 
                  _showPropertyCard && 
                  MediaQuery.of(context).viewInsets.bottom == 0 && 
                  !_showEmoji)
                _PropertyCard(
                  propertyId: widget.propertyId,
                  title: widget.propertyTitle!,
                  rent: widget.propertyRent,
                  imageUrl: widget.propertyImage,
                  city: widget.propertyCity,
                  onClose: () => setState(() => _showPropertyCard = false),
                ),

              // ── Messages ──────────────────────────────────────────
              Expanded(
                child: _messages.isEmpty
                    ? _EmptyChat(otherUserName: widget.otherUserName)
                    : Stack(
                        children: [
                          ListView.builder(
                            controller: _scrollCtrl,
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            itemCount: _messages.length + 1, // +1 for date header
                            itemBuilder: (_, i) {
                              if (i == 0) {
                                return const _DateDivider(label: 'Today');
                              }
                              final msg = _messages[i - 1];
                              final isMe = msg.sender == _currentUserId;
                              final showAvatar = !isMe &&
                                  (i == 1 || _messages[i - 2].sender != msg.sender);
                              
                              // Determine border radius sequence
                              bool isFirstInSequence = true;
                              bool isLastInSequence = true;
                              if (i > 1 && _messages[i - 2].sender == msg.sender) {
                                isFirstInSequence = false;
                              }
                              if (i < _messages.length && _messages[i].sender == msg.sender) {
                                isLastInSequence = false;
                              }

                              return _MessageBubble(
                                message: msg,
                                isMe: isMe,
                                showAvatar: showAvatar,
                                isFirst: isFirstInSequence,
                                isLast: isLastInSequence,
                                otherInitial: widget.otherUserName.isNotEmpty
                                    ? widget.otherUserName[0].toUpperCase()
                                    : '?',
                              );
                            },
                          ),
                          if (!_isAtBottom)
                            Positioned(
                              right: 16,
                              bottom: 16,
                              child: _ScrollToBottomButton(
                                unreadCount: _unreadCount,
                                onTap: () {
                                  _scrollToBottom();
                                  setState(() => _unreadCount = 0);
                                  ref.read(webSocketServiceProvider(widget.conversationId)).markAsRead();
                                },
                              ),
                            ),
                        ],
                      ),
              ),

              // ── Typing indicator ──────────────────────────────────
              if (_isTyping)
                Padding(
                  padding: const EdgeInsets.only(left: 56, bottom: 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          )
                        ],
                      ),
                      child: const _TypingDots(),
                    ),
                  ),
                ),

              // ── Quick replies ─────────────────────────────────────
              _QuickReplies(
                replies: _quickReplies,
                onTap: (label) => _send(label),
              ),

              // ── Input bar ─────────────────────────────────────────
              _InputBar(
                controller: _inputCtrl,
                focusNode: _focusNode,
                onSend: _pendingAudioPath != null ? _sendPendingAudio : _send,
                onEmoji: () {
                  if (_showEmoji) {
                    setState(() => _showEmoji = false);
                    _focusNode.requestFocus();
                  } else {
                    _focusNode.unfocus();
                    setState(() => _showEmoji = true);
                  }
                },
                onRecordStart: _startRecording,
                onRecordStop: _stopRecording,
                isRecording: _isRecording,
                recordDuration: _recordDuration,
                showEmoji: _showEmoji,
                pendingAudioPath: _pendingAudioPath,
                pendingAudioDuration: _pendingAudioDuration,
                onCancelAudio: _cancelPendingAudio,
              ),
              if (_showEmoji)
                Flexible(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 250),
                    child: EmojiPicker(
                      textEditingController: _inputCtrl,
                      config: const Config(
                        height: 250,
                        checkPlatformCompatibility: true,
                        emojiViewConfig: EmojiViewConfig(
                          backgroundColor: Color(0xFFF1F5F9),
                        ),
                        bottomActionBarConfig: BottomActionBarConfig(
                          showSearchViewButton: false,
                          showBackspaceButton: false,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── App Bar ───────────────────────────────────────────────────

class _ChatAppBar extends StatelessWidget {
  const _ChatAppBar({
    required this.otherUserName,
    required this.isTyping,
    this.currentUserRole,
    this.propertyTitle,
    required this.onBack,
  });
  final String otherUserName;
  final bool isTyping;
  final String? currentUserRole;
  final String? propertyTitle;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          color: Colors.white.withValues(alpha: 0.8),
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 8,
            bottom: 12,
            left: 4,
            right: 8,
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    size: 18, color: Color(0xFF0F172A)),
                onPressed: onBack,
              ),
              // Avatar with online dot
              Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 20,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        otherUserName.isNotEmpty
                            ? otherUserName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      otherUserName,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    Text(
                      isTyping
                          ? 'typing...'
                          : (propertyTitle != null
                              ? '${currentUserRole == 'TENANT' ? 'Host' : 'Tenant'} • Online'
                              : 'Online'),
                      style: TextStyle(
                        fontSize: 12,
                        color: isTyping
                            ? AppColors.primary
                            : const Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.phone_rounded,
                    color: Color(0xFF0F172A), size: 22),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.more_vert_rounded,
                    color: Color(0xFF0F172A), size: 22),
                onPressed: () {},
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Property Card ─────────────────────────────────────────────

class _PropertyCard extends StatelessWidget {
  const _PropertyCard({
    this.propertyId,
    required this.title,
    this.rent,
    this.imageUrl,
    this.city,
    this.onClose,
  });
  final String? propertyId;
  final String title;
  final double? rent;
  final String? imageUrl;
  final String? city;
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Thumbnail
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 64,
                height: 64,
                child: imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: imageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: AppColors.surfaceVariant),
                        errorWidget: (_, __, ___) =>
                            Container(color: AppColors.surfaceVariant,
                                child: const Icon(Icons.home_outlined,
                                    color: AppColors.textHint)),
                      )
                    : Container(
                        color: AppColors.surfaceVariant,
                        child: const Icon(Icons.home_outlined,
                            color: AppColors.textHint)),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                if (rent != null)
                  Text(
                    '₹${_fmt(rent!)} / month',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                const SizedBox(height: 2),
                if (city != null)
                  Text(city!,
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          if (propertyId != null)
            GestureDetector(
              onTap: () => context.push('/properties/$propertyId'),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    )
                  ],
                ),
                child: const Text(
                  'View',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          if (onClose != null)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: GestureDetector(
                onTap: onClose,
                child: const Icon(Icons.close_rounded,
                    color: AppColors.textHint, size: 20),
              ),
            ),
        ],
      ),
    );
  }

  String _fmt(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(0)},000';
    return v.toStringAsFixed(0);
  }
}

// ── Date Divider ──────────────────────────────────────────────

class _DateDivider extends StatelessWidget {
  const _DateDivider({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textHint,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
        ],
      ),
    );
  }
}

// ── Message Bubble ────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.showAvatar,
    required this.isFirst,
    required this.isLast,
    required this.otherInitial,
  });
  final ChatMessage message;
  final bool isMe;
  final bool showAvatar;
  final bool isFirst;
  final bool isLast;
  final String otherInitial;

  @override
  Widget build(BuildContext context) {
    // Use actual sender name initial if available
    final initial = message.senderName.isNotEmpty
        ? message.senderName[0].toUpperCase()
        : otherInitial;
    final displayName = message.senderName.isNotEmpty
        ? message.senderName
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Other user avatar
          if (!isMe)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: showAvatar
                  ? CircleAvatar(
                      radius: 16,
                      backgroundColor: AppColors.primaryLight,
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    )
                  : const SizedBox(width: 32),
            ),

          // Bubble
          Flexible(
            child: Column(
              crossAxisAlignment: isMe
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                // Show sender name above first message in a group
                if (!isMe && showAvatar && displayName != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 3),
                    child: Text(
                      displayName,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),

                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isMe ? null : Colors.white,
                    gradient: isMe
                        ? const LinearGradient(
                            colors: [AppColors.primary, Color(0xFF3B82F6)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(isMe || isFirst ? 20 : 4),
                      topRight: Radius.circular(!isMe || isFirst ? 20 : 4),
                      bottomLeft: Radius.circular(isMe || isLast ? 20 : 4),
                      bottomRight: Radius.circular(!isMe || isLast ? 20 : 4),
                    ),
                    border: isMe
                        ? null
                        : Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      if (isLast)
                        BoxShadow(
                          color: isMe 
                              ? AppColors.primary.withValues(alpha: 0.15)
                              : Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (message.messageType == 'AUDIO')
                        _AudioMessageBubbleContent(
                          audioUrl: message.audioUrl,
                          isMe: isMe,
                        )
                      else
                        Text(
                          message.content,
                          style: TextStyle(
                            fontSize: 15,
                            color: isMe ? Colors.white : const Color(0xFF0F172A),
                            height: 1.4,
                          ),
                        ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            DateFormat('h:mm a')
                                .format(message.createdAt.toLocal()),
                            style: TextStyle(
                              fontSize: 10,
                              color: isMe ? Colors.white70 : AppColors.textHint,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (isMe) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.done_all_rounded,
                              size: 14,
                              color: message.isRead 
                                  ? const Color(0xFF60A5FA) 
                                  : Colors.white70,
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Replies ─────────────────────────────────────────────

class _QuickReplies extends StatelessWidget {
  const _QuickReplies({required this.replies, required this.onTap});
  final List<({IconData icon, String label})> replies;
  final void Function(String) onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: replies.map((r) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => onTap(r.label),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(r.icon,
                                size: 13,
                                color: AppColors.primary),
                            const SizedBox(width: 5),
                            Text(
                              r.label,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Icon(Icons.chevron_right,
              color: AppColors.textHint, size: 20),
        ],
      ),
    );
  }
}

// ── Input Bar ─────────────────────────────────────────────────

class _InputBar extends StatelessWidget {
  const _InputBar({
    required this.controller,
    required this.focusNode,
    required this.onSend,
    required this.onEmoji,
    required this.onRecordStart,
    required this.onRecordStop,
    required this.isRecording,
    required this.recordDuration,
    required this.showEmoji,
    required this.pendingAudioPath,
    required this.pendingAudioDuration,
    required this.onCancelAudio,
  });
  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onSend;
  final VoidCallback onEmoji;
  final VoidCallback onRecordStart;
  final VoidCallback onRecordStop;
  final bool isRecording;
  final int recordDuration;
  final bool showEmoji;
  final String? pendingAudioPath;
  final int pendingAudioDuration;
  final VoidCallback onCancelAudio;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: (showEmoji || MediaQuery.of(context).viewInsets.bottom > 0)
            ? 12
            : MediaQuery.of(context).padding.bottom + 12,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Text field / Recording indicator
          Expanded(
            child: Container(
              constraints: const BoxConstraints(minHeight: 40),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                child: isRecording
                    ? Row(
                        key: const ValueKey('recording'),
                        children: [
                          const SizedBox(width: 8),
                          const Icon(Icons.mic_rounded, color: Colors.red, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Recording... ${_formatDuration(recordDuration)}',
                            style: const TextStyle(
                              fontSize: 15,
                              color: Colors.red,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      )
                    : pendingAudioPath != null
                        ? Row(
                            key: const ValueKey('pending'),
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: onCancelAudio,
                              ),
                              const Icon(Icons.audiotrack, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Text(
                                'Voice Note (${_formatDuration(pendingAudioDuration)})',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                              ),
                              const Spacer(),
                            ],
                          )
                        : Row(
                            key: const ValueKey('typing'),
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                        // Emoji
                        Padding(
                          padding: const EdgeInsets.only(left: 4, right: 4, bottom: 8),
                          child: GestureDetector(
                            onTap: onEmoji,
                            child: Icon(
                              showEmoji ? Icons.keyboard_alt_outlined : Icons.sentiment_satisfied_outlined,
                              color: AppColors.textHint, 
                              size: 24,
                            ),
                          ),
                        ),
                        Expanded(
                          child: TextField(
                            controller: controller,
                            focusNode: focusNode,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (_) => onSend(),
                            minLines: 1,
                            maxLines: 4,
                            style: const TextStyle(
                                fontSize: 15, color: Color(0xFF0F172A)),
                            decoration: const InputDecoration(
                              hintText: 'Type a message...',
                              hintStyle: TextStyle(
                                  color: AppColors.textHint, fontSize: 15),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 10),
                              border: InputBorder.none,
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ),
              ),
            ),
          ),
          const SizedBox(width: 4),

          // Send / Mic button
          Padding(
            padding: const EdgeInsets.only(bottom: 1),
            child: GestureDetector(
              onTap: (controller.text.trim().isNotEmpty || pendingAudioPath != null) ? onSend : null,
              onLongPressStart: (controller.text.trim().isEmpty && pendingAudioPath == null) ? (_) => onRecordStart() : null,
              onLongPressEnd: (controller.text.trim().isEmpty && pendingAudioPath == null) ? (_) => onRecordStop() : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: isRecording ? 44 : 38,
                height: isRecording ? 44 : 38,
                decoration: BoxDecoration(
                  gradient: isRecording 
                      ? const LinearGradient(colors: [Colors.redAccent, Colors.red])
                      : const LinearGradient(
                          colors: [AppColors.primary, Color(0xFF3B82F6)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  (controller.text.trim().isNotEmpty || pendingAudioPath != null)
                      ? Icons.send_rounded
                      : Icons.mic_rounded,
                  color: Colors.white,
                  size: isRecording ? 24 : 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int seconds) {
    final m = (seconds / 60).floor();
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }
}

// ── Typing Dots ───────────────────────────────────────────────

class _TypingDots extends StatefulWidget {
  const _TypingDots();
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final delay = i / 3;
            final t = (_ctrl.value - delay).clamp(0.0, 1.0);
            final opacity = (t < 0.5 ? t * 2 : (1 - t) * 2).clamp(0.3, 1.0);
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: AppColors.textHint.withValues(alpha: opacity),
                shape: BoxShape.circle,
              ),
            );
          }),
        );
      },
    );
  }
}

// ── Empty Chat ────────────────────────────────────────────────

class _EmptyChat extends StatelessWidget {
  const _EmptyChat({required this.otherUserName});
  final String otherUserName;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.chat_bubble_outline_rounded,
                size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          Text(
            'Say hi to $otherUserName!',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Start the conversation about the property.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ── Audio Message Bubble Content ────────────────────────────────

class _AudioMessageBubbleContent extends StatefulWidget {
  final String? audioUrl;
  final bool isMe;

  const _AudioMessageBubbleContent({required this.audioUrl, required this.isMe});

  @override
  State<_AudioMessageBubbleContent> createState() => _AudioMessageBubbleContentState();
}

class _AudioMessageBubbleContentState extends State<_AudioMessageBubbleContent> {
  final _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  @override
  void initState() {
    super.initState();
    _setupAudioPlayer();
  }

  Future<void> _setupAudioPlayer() async {
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
        });
      }
    });

    _audioPlayer.onDurationChanged.listen((newDuration) {
      if (mounted) {
        setState(() {
          _duration = newDuration;
        });
      }
    });

    _audioPlayer.onPositionChanged.listen((newPosition) {
      if (mounted) {
        setState(() {
          _position = newPosition;
        });
      }
    });

    if (widget.audioUrl != null) {
      if (widget.audioUrl!.startsWith('http')) {
        await _audioPlayer.setSourceUrl(widget.audioUrl!);
      } else {
        await _audioPlayer.setSourceDeviceFile(widget.audioUrl!);
      }
    }
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "$twoDigitMinutes:$twoDigitSeconds";
  }

  @override
  Widget build(BuildContext context) {
    final textColor = widget.isMe ? Colors.white : const Color(0xFF0F172A);
    final iconColor = widget.isMe ? Colors.white : AppColors.primary;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: () {
            if (_isPlaying) {
              _audioPlayer.pause();
            } else {
              _audioPlayer.resume();
            }
          },
          child: Icon(
            _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
            color: iconColor,
            size: 36,
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 120,
              height: 20,
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                  trackHeight: 2,
                  activeTrackColor: widget.isMe ? Colors.white : AppColors.primary,
                  inactiveTrackColor: widget.isMe ? Colors.white.withValues(alpha: 0.3) : AppColors.textHint.withValues(alpha: 0.3),
                  thumbColor: widget.isMe ? Colors.white : AppColors.primary,
                ),
                child: Slider(
                  min: 0,
                  max: _duration.inSeconds.toDouble() > 0 ? _duration.inSeconds.toDouble() : 1,
                  value: _position.inSeconds.toDouble().clamp(0, _duration.inSeconds.toDouble() > 0 ? _duration.inSeconds.toDouble() : 1),
                  onChanged: (value) async {
                    final position = Duration(seconds: value.toInt());
                    await _audioPlayer.seek(position);
                  },
                ),
              ),
            ),
            Text(
              '${_formatDuration(_position)} / ${_formatDuration(_duration)}',
              style: TextStyle(
                fontSize: 10,
                color: textColor.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ScrollToBottomButton extends StatelessWidget {
  const _ScrollToBottomButton({
    required this.unreadCount,
    required this.onTap,
  });
  final int unreadCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        FloatingActionButton.small(
          onPressed: onTap,
          backgroundColor: Colors.white,
          elevation: 4,
          child: const Icon(Icons.keyboard_arrow_down, color: AppColors.primary),
        ),
        if (unreadCount > 0)
          Positioned(
            top: -4,
            right: -4,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$unreadCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
