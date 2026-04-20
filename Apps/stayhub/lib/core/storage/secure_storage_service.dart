import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

/// Wraps FlutterSecureStorage for JWT access/refresh token management.
/// Backed by Android Keystore on Android devices.
class SecureStorageService {
  SecureStorageService() : _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(),
  );

  final FlutterSecureStorage _storage;

  // ── Device ID ─────────────────────────────────────────────
  /// Returns a stable random device identifier, generating one on first call.
  Future<String> getOrCreateDeviceId() async {
    final existing = await _storage.read(key: _kDeviceIdKey);
    if (existing != null) return existing;
    final id = _generateId();
    await _storage.write(key: _kDeviceIdKey, value: id);
    return id;
  }

  static const String _kDeviceIdKey = 'device_id';

  static String _generateId() {
    const chars = 'abcdef0123456789';
    final rng = Random.secure();
    String segment(int len) =>
        List.generate(len, (_) => chars[rng.nextInt(chars.length)]).join();
    return '${segment(8)}-${segment(4)}-4${segment(3)}-${segment(4)}-${segment(12)}';
  }

  // ── Write ─────────────────────────────────────────────────
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: token);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: AppConstants.refreshTokenKey, value: token);
  }

  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    await Future.wait([
      saveAccessToken(access),
      saveRefreshToken(refresh),
    ]);
  }

  // ── Read ──────────────────────────────────────────────────
  Future<String?> getAccessToken() async {
    return _storage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: AppConstants.refreshTokenKey);
  }

  // ── Delete ────────────────────────────────────────────────
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: AppConstants.accessTokenKey),
      _storage.delete(key: AppConstants.refreshTokenKey),
    ]);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
