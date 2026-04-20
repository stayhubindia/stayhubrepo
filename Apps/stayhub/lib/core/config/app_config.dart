import 'package:flutter/foundation.dart';

enum Env { dev, prod }

class AppConfig {
  AppConfig._();

  static const Env env = kDebugMode ? Env.dev : Env.prod;

  // ── Base URLs ─────────────────────────────────────────────

  static const String _devBaseUrl = 'https://6lr008c1-8000.inc1.devtunnels.ms/';
  static const String _prodBaseUrl = 'https://api.stayhub.in';

  static String get baseUrl => env == Env.dev ? _devBaseUrl : _prodBaseUrl;

  // WebSocket base  (ws:// in dev, wss:// in prod)
  static String get wsBaseUrl => env == Env.dev
      ? 'wss://6lr008c1-8000.inc1.devtunnels.ms/'
      : 'wss://api.stayhub.in';

  // ── Timeouts ─────────────────────────────────────────────
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
