class OtpRequestPayload {
  const OtpRequestPayload({required this.email});
  final String email;
  Map<String, dynamic> toJson() => {'email': email};
}

class OtpVerifyPayload {
  const OtpVerifyPayload({
    required this.email,
    required this.otp,
    this.role,
    this.rememberMe,
  });

  final String email;
  final String otp;
  final String? role; // 'OWNER' | 'TENANT' for new users
  final bool? rememberMe;

  Map<String, dynamic> toJson() => {
        'email': email,
        'otp': otp,
        if (role != null) 'role': role,
        if (rememberMe != null) 'remember_me': rememberMe,
      };
}

class FirebaseLoginPayload {
  const FirebaseLoginPayload({required this.firebaseToken, required this.role});
  final String firebaseToken;
  final String role;
  Map<String, dynamic> toJson() => {
        'firebase_token': firebaseToken,
        'role': role,
      };
}

class AuthResponse {
  const AuthResponse({
    required this.access,
    required this.refresh,
    required this.user,
  });

  final String access;
  final String refresh;
  final Map<String, dynamic> user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final tokens = json['tokens'] as Map<String, dynamic>? ?? json;
    return AuthResponse(
      access: tokens['access'] as String,
      refresh: tokens['refresh'] as String,
      user: json['user'] as Map<String, dynamic>,
    );
  }
}
