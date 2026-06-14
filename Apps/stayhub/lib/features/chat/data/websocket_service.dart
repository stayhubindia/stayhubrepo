import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/storage/secure_storage_service.dart';

/// Message types sent/received over the WebSocket.
enum WsMessageType { chatMessage, typing, read, connected, error, unknown }

class WsMessage {
  const WsMessage({required this.type, this.payload});
  final WsMessageType type;
  final Map<String, dynamic>? payload;
}

/// Manages a single WebSocket connection to a conversation channel.
/// Reconnects on failure with capped backoff.
class WebSocketService {
  WebSocketService({required SecureStorageService storage})
      : _storage = storage;

  final SecureStorageService _storage;

  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  final _controller = StreamController<WsMessage>.broadcast();

  String? _conversationId;
  bool _disposed = false;
  int _retryCount = 0;
  static const _maxRetries = 5;

  Stream<WsMessage> get stream => _controller.stream;
  bool _isAuthenticated = false;
  bool get isConnected => _channel != null && _isAuthenticated;

  Future<void> connect(String conversationId) async {
    _conversationId = conversationId;
    _disposed = false;
    _retryCount = 0;
    await _doConnect();
  }

  Future<void> _doConnect() async {
    final token = await _storage.getAccessToken();
    if (token == null || _disposed) {
      debugPrint('[WS] Cannot connect — no token or disposed');
      return;
    }

    final uri = Uri.parse(
      '${AppConfig.wsBaseUrl}/ws/communication/conversations/$_conversationId/',
    );

    debugPrint('[WS] Connecting to: $uri');

    try {
      _channel = WebSocketChannel.connect(uri);

      await _channel!.ready;
      debugPrint('[WS] Handshake complete');

      // Set up the stream listener
      _sub = _channel!.stream.listen(
        _onData,
        onError: (e) {
          debugPrint('[WS] Stream error: $e');
          _onDisconnected();
        },
        onDone: () {
          debugPrint('[WS] Stream closed');
          _onDisconnected();
        },
      );

      if (_disposed || _channel == null) return;

      // Send authenticate message
      debugPrint('[WS] Sending authenticate...');
      _channel!.sink.add(jsonEncode({
        'action': 'authenticate',
        'token': token,
      }));
      _isAuthenticated = true;

      _retryCount = 0;
      debugPrint('[WS] Connected and authenticated');
    } catch (e) {
      debugPrint('[WS] Connection failed: $e');
      _channel = null;
      _scheduleReconnect();
    }
  }

  void _onData(dynamic raw) {
    if (raw is! String) return;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final typeStr = json['type'] as String?;
      final type = _parseType(typeStr);
      // Log all incoming WS messages for debugging
      debugPrint('[WS] Received: type=$typeStr payload=$json');
      _controller.add(WsMessage(type: type, payload: json));
    } catch (e) {
      debugPrint('[WS] Parse error: $e raw=$raw');
      _controller.add(const WsMessage(type: WsMessageType.error));
    }
  }

  void _onDisconnected() {
    _channel = null;
    _isAuthenticated = false;
    _sub?.cancel();
    _sub = null;
    if (!_disposed) _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_retryCount >= _maxRetries || _disposed) return;
    final delay = Duration(seconds: 3 * (_retryCount + 1));
    _retryCount++;
    Future.delayed(delay, _doConnect);
  }

  void sendMessage(String content, {String? clientId}) {
    final data = <String, dynamic>{
      'action': 'send_message',
      'content': content,
    };
    if (clientId != null) data['client_id'] = clientId;
    _send(data);
  }

  void sendTyping(bool isTyping) {
    _send({'action': 'typing', 'is_typing': isTyping});
  }

  void markAsRead() {
    _send({'action': 'mark_read'});
  }

  void _send(Map<String, dynamic> data) {
    if (_channel == null || !_isAuthenticated) {
      debugPrint('[WS] Cannot send — not connected/authenticated: $data');
      return;
    }
    debugPrint('[WS] Sending: $data');
    _channel!.sink.add(jsonEncode(data));
  }

  Future<void> disconnect() async {
    _disposed = true;
    await _sub?.cancel();
    await _channel?.sink.close();
    _channel = null;
  }

  void dispose() {
    disconnect();
    _controller.close();
  }

  static WsMessageType _parseType(String? type) {
    switch (type) {
      case 'message.created':
        return WsMessageType.chatMessage;
      case 'typing.updated':
        return WsMessageType.typing;
      case 'read.updated':
        return WsMessageType.read;
      case 'connected':
        return WsMessageType.connected;
      case 'error':
        return WsMessageType.error;
      default:
        return WsMessageType.unknown;
    }
  }
}
