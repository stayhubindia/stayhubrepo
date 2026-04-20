import 'dart:async';
import 'dart:convert';
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
  bool get isConnected => _channel != null;

  Future<void> connect(String conversationId) async {
    _conversationId = conversationId;
    _disposed = false;
    _retryCount = 0;
    await _doConnect();
  }

  Future<void> _doConnect() async {
    final token = await _storage.getAccessToken();
    if (token == null || _disposed) return;

    final uri = Uri.parse(
      '${AppConfig.wsBaseUrl}/ws/chat/$_conversationId/?token=$token',
    );

    try {
      _channel = WebSocketChannel.connect(uri);
      _sub = _channel!.stream.listen(
        _onData,
        onError: (_) => _onDisconnected(),
        onDone: _onDisconnected,
      );
      _retryCount = 0;
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _onData(dynamic raw) {
    if (raw is! String) return;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final type = _parseType(json['type'] as String?);
      _controller.add(WsMessage(type: type, payload: json));
    } catch (_) {
      _controller.add(const WsMessage(type: WsMessageType.error));
    }
  }

  void _onDisconnected() {
    _channel = null;
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

  void sendMessage(String content) {
    _send({'type': 'chat_message', 'content': content});
  }

  void sendTyping() {
    _send({'type': 'typing'});
  }

  void _send(Map<String, dynamic> data) {
    if (_channel == null) return;
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
      case 'chat_message':
        return WsMessageType.chatMessage;
      case 'typing':
        return WsMessageType.typing;
      case 'read':
        return WsMessageType.read;
      case 'connected':
        return WsMessageType.connected;
      default:
        return WsMessageType.unknown;
    }
  }
}
