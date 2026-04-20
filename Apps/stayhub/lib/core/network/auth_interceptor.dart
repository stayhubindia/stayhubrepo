import 'dart:math';
import 'package:dio/dio.dart';
import '../errors/app_exception.dart';
import '../storage/secure_storage_service.dart';
import '../constants/api_constants.dart';

/// Attaches the JWT access token and client identity headers to every request.
/// On 401, refreshes the token and retries once.
/// On second 401, clears tokens (triggers logout via authProvider).
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

  // Prevents concurrent refresh races
  bool _isRefreshing = false;

  static String _newRequestId() {
    const chars = 'abcdef0123456789';
    final rng = Random.secure();
    String s(int n) =>
        List.generate(n, (_) => chars[rng.nextInt(chars.length)]).join();
    return '${s(8)}-${s(4)}-4${s(3)}-${s(4)}-${s(12)}';
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // ── JWT token ─────────────────────────────────────────
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // ── Client identity headers ───────────────────────────
    options.headers['X-Client-App'] = 'stayhub-mobile';
    options.headers['X-Client-Version'] = 'v1';
    options.headers['X-Request-ID'] = _newRequestId();

    final deviceId = await _storage.getOrCreateDeviceId();
    options.headers['X-Device-ID'] = deviceId;

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401 || _isRefreshing) {
      handler.next(_toDomainException(err));
      return;
    }

    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        _onSessionExpired();
        handler.reject(err);
        return;
      }

      final response = await _dio.post(
        ApiConstants.tokenRefresh,
        data: {'refresh': refreshToken},
        options: Options(headers: {'Authorization': null}),
      );

      final newAccess = response.data['access'] as String;
      await _storage.saveAccessToken(newAccess);

      // Retry original request with new token
      final opts = err.requestOptions
        ..headers['Authorization'] = 'Bearer $newAccess';
      final retryResponse = await _dio.fetch(opts);
      handler.resolve(retryResponse);
    } catch (_) {
      await _storage.clearTokens();
      _onSessionExpired();
      handler.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }

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
      }

      appErr = ValidationException(message, fieldErrors: fieldErrors);
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
