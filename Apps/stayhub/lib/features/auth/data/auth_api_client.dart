import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import 'models/auth_models.dart';

class AuthApiClient {
  const AuthApiClient(this._dio);
  final Dio _dio;

  /// Step 1 — request OTP; backend emails a code to the user.
  Future<void> requestOtp(OtpRequestPayload payload) async {
    await _dio.post(
      ApiConstants.otpRequest,
      data: payload.toJson(),
      options: Options(headers: {'Authorization': null}),
    );
  }

  /// Step 2 — verify OTP; returns tokens + user on success.
  Future<AuthResponse> verifyOtp(OtpVerifyPayload payload) async {
    final res = await _dio.post(
      ApiConstants.otpVerify,
      data: payload.toJson(),
      options: Options(headers: {'Authorization': null}),
    );
    return AuthResponse.fromJson(res.data as Map<String, dynamic>);
  }

  /// Firebase / Google sign-in.
  Future<AuthResponse> firebaseLogin(FirebaseLoginPayload payload) async {
    final res = await _dio.post(
      ApiConstants.firebaseLogin,
      data: payload.toJson(),
      options: Options(headers: {'Authorization': null}),
    );
    return AuthResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<AuthResponse> refreshToken(String refreshToken) async {
    final res = await _dio.post(
      ApiConstants.tokenRefresh,
      data: {'refresh': refreshToken},
      options: Options(headers: {'Authorization': null}),
    );
    // Refresh returns { access, refresh } (no user wrapper)
    final data = res.data as Map<String, dynamic>;
    return AuthResponse(
      access: data['access'] as String,
      refresh: data['refresh'] as String,
      user: const {},
    );
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await _dio.get(ApiConstants.me);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> data) async {
    final res = await _dio.patch(ApiConstants.me, data: data);
    return res.data as Map<String, dynamic>;
  }
}
