// Firebase options loaded from the .env file at runtime.
// Values are sourced from the Firebase project "stayhub-india".

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for iOS — '
          'run flutterfire configure to generate them.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // ── Shared helpers ────────────────────────────────────────

  static String _get(String key) {
    final value = dotenv.env[key];
    if (value == null || value.isEmpty) {
      throw StateError(
        'Missing required Firebase environment variable: $key\n'
        'Please ensure your .env file is properly configured.',
      );
    }
    return value;
  }

  // ── Android ──────────────────────────────────────────────
  static FirebaseOptions get android => FirebaseOptions(
        apiKey: _get('FIREBASE_ANDROID_API_KEY'),
        appId: _get('FIREBASE_APP_ID'),
        messagingSenderId: _get('FIREBASE_MESSAGING_SENDER_ID'),
        projectId: _get('FIREBASE_PROJECT_ID'),
        storageBucket: _get('FIREBASE_STORAGE_BUCKET'),
      );
}
