import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import 'auth_interceptor.dart';

/// Creates and configures the singleton Dio instance used by all API clients.
Dio createDio({
  required SecureStorageService storage,
  required void Function() onSessionExpired,
}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      sendTimeout: AppConfig.sendTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(
      storage: storage,
      dio: dio,
      onSessionExpired: onSessionExpired,
    ),
    // Log requests in debug mode
    LogInterceptor(
      requestBody: true,
      responseBody: true,
      requestHeader: false,
      responseHeader: false,
      error: true,
      logPrint: (obj) => debugPrint('[Dio] $obj'),
    ),
  ]);

  return dio;
}
