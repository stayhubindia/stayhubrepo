import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/storage/secure_storage_service.dart';
import 'conversations_api_client.dart';

enum GlobalWsMessageType { conversationUpdated, error, unknown }

class GlobalWsMessage {
  const GlobalWsMessage({required this.type, this.payload});
  final GlobalWsMessageType type;
  final Map<String, dynamic>? payload;
}

class GlobalWebSocketService {
  GlobalWebSocketService({required SecureStorageService storage})
      : _storage = storage;

  final SecureStorageService _storage;
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  final _controller = StreamController<GlobalWsMessage>.broadcast();

  bool _disposed = false;
  int _retryCount = 0;
  static const _maxRetries = 5;

  Stream<GlobalWsMessage> get stream => _controller.stream;

  Future<void> connect() async {
    if (_channel != null) return;
    _disposed = false;
    _retryCount = 0;
    await _doConnect();
  }

  Future<void> _doConnect() async {
    final token = await _storage.getAccessToken();
    if (token == null || _disposed) return;

    final uri = Uri.parse('${AppConfig.wsBaseUrl}/ws/communication/user/');
    debugPrint('[Global WS] Connecting to: $uri');

    try {
      _channel = WebSocketChannel.connect(uri);
      await _channel!.ready;

      _sub = _channel!.stream.listen(
        _onData,
        onError: (e) {
          debugPrint('[Global WS] error: $e');
          _onDisconnected();
        },
        onDone: () {
          _onDisconnected();
        },
      );

      if (_disposed || _channel == null) return;

      _channel!.sink.add(jsonEncode({
        'action': 'authenticate',
        'token': token,
      }));

      _retryCount = 0;
      debugPrint('[Global WS] Connected and authenticated');
    } catch (e) {
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
      _controller.add(GlobalWsMessage(type: type, payload: json));
    } catch (e) {
      debugPrint('[Global WS] Parse error: $e');
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

  static GlobalWsMessageType _parseType(String? type) {
    switch (type) {
      case 'conversation.updated':
        return GlobalWsMessageType.conversationUpdated;
      case 'error':
        return GlobalWsMessageType.error;
      default:
        return GlobalWsMessageType.unknown;
    }
  }
}
