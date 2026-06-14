import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../constants/api_constants.dart';
import '../errors/app_exception.dart';
import '../storage/secure_storage_service.dart';

/// Attaches all required headers to every outbound API request and handles
/// JWT token refresh on 401.
///
/// Headers sent on every request (matching server ClientVerificationMiddleware):
///   Authorization:    Bearer `<access_token>`   (when authenticated)
///   X-Client-App:     stayhub-mobile
///   X-Client-Version: v1
///   X-Request-ID:     `<uuid-v4>`
///   X-Device-ID:      `<stable-device-uuid>`
///   X-App-Signature:  {timestamp}.{hmac-sha256-hex}  (when enabled)
///
/// HMAC scheme (must match server _verify_hmac):
///   message = "{timestamp}:{METHOD}:{path}"
///   secret  = APP_SECRET from .env
///   header  = X-App-Signature: {timestamp}.{hex_digest}
///   window  = ±5 minutes (replay protection on server)
///
/// Exempt paths (no signature required, matching server EXEMPT_PATHS):
///   /api/v1/health/
///   /api/v1/auth/firebase/login/
///   /api/v1/auth/firebase/link/
///   /api/v1/auth/email-otp/request/
///   /api/v1/auth/email-otp/verify/
///   /api/v1/auth/token/refresh/
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required SecureStorageService storage,
    required Dio dio,
    required void Function() onSessionExpired,
  })  : _storage = storage,
        _dio = dio,
        _onSessionExpired = onSessionExpired;

  final SecureStorageService _storage;
  final Dio _dio;
  final void Function() _onSessionExpired;

  bool _isRefreshing = false;

  // ── Paths that skip HMAC + client-app validation on the server ────────────
  static const _exemptPaths = {
    '/api/v1/health/',
    '/api/v1/auth/firebase/login/',
    '/api/v1/auth/firebase/link/',
    '/api/v1/auth/email-otp/request/',
    '/api/v1/auth/email-otp/verify/',
    '/api/v1/auth/token/refresh/',
  };

  // ── UUID v4 generator ─────────────────────────────────────────────────────
  static String _uuid() {
    final rng = Random.secure();
    final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    String hex(int b) => b.toRadixString(16).padLeft(2, '0');
    final h = bytes.map(hex).join();
    return '${h.substring(0, 8)}-${h.substring(8, 12)}-'
        '${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
  }

  // ── HMAC-SHA256 signature ─────────────────────────────────────────────────
  // Matches server _verify_hmac:
  //   message = "{timestamp}:{METHOD}:{path}"
  //   header  = X-App-Signature: {timestamp}.{hex_digest}
  static String _sign(String secret, String method, String path) {
    final timestamp = (DateTime.now().millisecondsSinceEpoch ~/ 1000).toString();
    final message = '$timestamp:${method.toUpperCase()}:$path';
    final key = utf8.encode(secret);
    final msg = utf8.encode(message);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(msg).toString(); // hex string
    return '$timestamp.$digest';
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // ── JWT access token ──────────────────────────────────────────────────
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // ── Client identity headers (always) ─────────────────────────────────
    options.headers['X-Client-App']     = 'stayhub-mobile';
    options.headers['X-Client-Version'] = 'v1';
    options.headers['X-Request-ID']     = _uuid();

    final deviceId = await _storage.getOrCreateDeviceId();
    options.headers['X-Device-ID'] = deviceId;

    // ── HMAC signature — always sign when secret is set ──────────────────
    // The server decides whether to enforce it (REQUIRE_CLIENT_SIGNATURE).
    // We sign unconditionally so the same build works in both dev and prod.
    final path = options.path; // e.g. /api/v1/properties/
    final isExempt = _exemptPaths.contains(path);
    final secret = AppConfig.appSecret;

    if (!isExempt && secret.isNotEmpty) {
      options.headers['X-App-Signature'] =
          _sign(secret, options.method, path);
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;

    // ── 401 → attempt token refresh once ─────────────────────────────────
    if (status == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await _storage.getRefreshToken();
        if (refreshToken == null) {
          _onSessionExpired();
          handler.reject(err);
          return;
        }

        // Refresh endpoint is exempt — no signature needed.
        final response = await _dio.post(
          ApiConstants.tokenRefresh,
          data: {'refresh': refreshToken},
          options: Options(
            headers: {
              'Authorization': null, // no auth header on refresh
              'X-Client-App': 'stayhub-mobile',
              'X-Client-Version': 'v1',
              'X-Request-ID': _uuid(),
            },
          ),
        );

        final newAccess = response.data['access'] as String;
        await _storage.saveAccessToken(newAccess);

        // Retry the original request with the new token.
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccess';
        final retryResponse = await _dio.fetch(retryOptions);
        handler.resolve(retryResponse);
      } catch (_) {
        await _storage.clearTokens();
        _onSessionExpired();
        handler.reject(err);
      } finally {
        _isRefreshing = false;
      }
      return;
    }

    handler.next(_toDomainException(err));
  }

  // ── Map HTTP errors to typed domain exceptions ────────────────────────────
  DioException _toDomainException(DioException err) {
    final status = err.response?.statusCode;
    AppException appErr;

    if (err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.unknown) {
      appErr = const NetworkException();
    } else if (status == 401) {
      appErr = const UnauthorizedException();
    } else if (status == 404) {
      appErr = const NotFoundException();
    } else if (status != null && status >= 500) {
      appErr = const ServerException();
    } else if (status == 400) {
      final data = err.response?.data;
      Map<String, List<String>>? fieldErrors;
      String message = 'Validation failed.';

      if (data is Map<String, dynamic>) {
        fieldErrors = {};
        data.forEach((key, value) {
          if (value is List) {
            fieldErrors![key] = value.map((e) => e.toString()).toList();
          } else if (value is String) {
            if (key == 'detail' || key == 'non_field_errors') {
              message = value;
            } else {
              fieldErrors![key] = [value];
            }
          }
        });
        // Server error envelope: { "error": { "code": ..., "detail": ... } }
        if (data['error'] is Map) {
          final errObj = data['error'] as Map<String, dynamic>;
          final detail = errObj['detail'];
          if (detail is String) {
            message = detail;
          } else if (detail is Map || detail is List) {
            message = detail.toString();
          }
        }
      }

      appErr = ValidationException(message, fieldErrors: fieldErrors);
    } else if (status == 429) {
      appErr = const AppException(
        'Too many requests. Please wait and try again.',
        statusCode: 429,
      );
    } else {
      appErr = AppException(
        err.message ?? 'Unexpected error.',
        statusCode: status,
      );
    }

    return DioException(
      requestOptions: err.requestOptions,
      error: appErr,
      response: err.response,
      type: err.type,
    );
  }
}
