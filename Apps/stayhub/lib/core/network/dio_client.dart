import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:crypto/crypto.dart';
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

  final pinningHashes = AppConfig.sslPinningHashes;
  if (pinningHashes.isNotEmpty) {
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        // By disabling default trust roots, we force validateCertificate to be called
        // for all connections, giving us full control over certificate validation.
        return HttpClient(context: SecurityContext(withTrustedRoots: false));
      },
      validateCertificate: (cert, host, port) {
        if (cert == null) return false;
        
        // Calculate SHA-256 fingerprint of the DER-encoded certificate
        final sha256Bytes = sha256.convert(cert.der).bytes;
        final hashStr = sha256Bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
        
        // Check if the calculated fingerprint is in our pinned list
        if (pinningHashes.contains(hashStr)) {
          return true;
        }
        
        debugPrint('[SSL Pinning] Rejected certificate for $host. Fingerprint: $hashStr');
        return false;
      },
    );
  }

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
