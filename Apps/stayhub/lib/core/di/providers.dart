import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/auth_api_client.dart';
import '../../features/auth/data/auth_repository_impl.dart';
import '../../features/auth/domain/auth_repository.dart';
import '../network/dio_client.dart';
import '../storage/secure_storage_service.dart';

// ── Storage ──────────────────────────────────────────────────
final secureStorageProvider = Provider<SecureStorageService>(
  (_) => SecureStorageService(),
);

// ── Session expired callback ──────────────────────────────────
// Filled in by app.dart after the authProvider is created.
final sessionExpiredCallbackProvider = Provider<void Function()>(
  (_) => () {},
);

// ── Dio ───────────────────────────────────────────────────────
final dioProvider = Provider((ref) {
  final storage = ref.read(secureStorageProvider);
  final onExpired = ref.read(sessionExpiredCallbackProvider);
  return createDio(storage: storage, onSessionExpired: onExpired);
});

// ── Auth API client ───────────────────────────────────────────
final authApiClientProvider = Provider(
  (ref) => AuthApiClient(ref.read(dioProvider)),
);

// ── Auth Repository ────────────────────────────────────────────
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(
    apiClient: ref.read(authApiClientProvider),
    storage: ref.read(secureStorageProvider),
  ),
);
