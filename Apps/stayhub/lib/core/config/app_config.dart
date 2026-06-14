import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  AppConfig._();

  static String get baseUrl =>
      dotenv.get('API_BASE_URL', fallback: 'https://api.stayhubindia.com');

  static String get wsBaseUrl =>
      dotenv.get('WS_BASE_URL', fallback: 'wss://api.stayhubindia.com');

  static String get appSecret =>
      dotenv.get('APP_SECRET', fallback: '');

  static String get googleMapsApiKey =>
      dotenv.get('GOOGLE_MAPS_API_KEY', fallback: '');

  /// A comma-separated list of SHA-256 certificate fingerprints (hex strings).
  /// Example: "a1b2c3d4..., e5f6g7h8..."
  static List<String> get sslPinningHashes {
    final hashes = dotenv.get('SSL_PINNING_HASHES', fallback: '');
    if (hashes.isEmpty) return [];
    return hashes.split(',').map((s) => s.trim().toLowerCase()).toList();
  }

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout    = Duration(seconds: 30);
}
