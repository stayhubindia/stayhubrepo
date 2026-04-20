import '../../../../core/storage/secure_storage_service.dart';
import '../domain/auth_repository.dart';
import '../domain/entities/app_user.dart';
import 'auth_api_client.dart';
import 'models/auth_models.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl({
    required AuthApiClient apiClient,
    required SecureStorageService storage,
  })  : _api = apiClient,
        _storage = storage;

  final AuthApiClient _api;
  final SecureStorageService _storage;

  @override
  Future<void> requestOtp({required String email}) =>
      _api.requestOtp(OtpRequestPayload(email: email));

  @override
  Future<AppUser> verifyOtp({
    required String email,
    required String otp,
    String? role,
    bool rememberMe = false,
  }) async {
    final res = await _api.verifyOtp(
      OtpVerifyPayload(
        email: email,
        otp: otp,
        role: role,
        rememberMe: rememberMe,
      ),
    );
    await _storage.saveTokens(access: res.access, refresh: res.refresh);
    return AppUser.fromJson(res.user);
  }

  @override
  Future<AppUser> googleSignIn({
    required String firebaseToken,
    required String role,
  }) async {
    final res = await _api.firebaseLogin(
      FirebaseLoginPayload(firebaseToken: firebaseToken, role: role),
    );
    await _storage.saveTokens(access: res.access, refresh: res.refresh);
    return AppUser.fromJson(res.user);
  }

  @override
  Future<void> logout() async {
    // Token blacklisting via refresh endpoint is optional — always clear locally.
    await _storage.clearTokens();
  }

  @override
  Future<AppUser?> getCurrentUser() async {
    final token = await _storage.getAccessToken();
    if (token == null) return null;
    try {
      final json = await _api.getMe();
      return AppUser.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<AppUser> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    final data = <String, dynamic>{
      if (firstName != null) 'first_name': firstName,
      if (lastName != null) 'last_name': lastName,
      if (phone != null) 'phone': phone,
    };
    final json = await _api.updateMe(data);
    return AppUser.fromJson(json);
  }
}
