import 'entities/app_user.dart';

abstract class AuthRepository {
  /// Step 1: request OTP — backend sends code to [email].
  Future<void> requestOtp({required String email});

  /// Step 2: verify OTP → returns authenticated user.
  /// [role] required only for new (first-time) users.
  Future<AppUser> verifyOtp({
    required String email,
    required String otp,
    String? role, // 'OWNER' | 'TENANT'
    bool rememberMe = false,
  });

  Future<AppUser> googleSignIn({required String firebaseToken, required String role});
  Future<void> logout();
  Future<AppUser?> getCurrentUser();
  Future<AppUser> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
  });
}
