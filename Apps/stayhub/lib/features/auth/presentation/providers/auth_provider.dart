import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/auth_repository.dart';
import '../../../../core/di/providers.dart';

// ── Auth State ────────────────────────────────────────────────

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

/// OTP has been sent — waiting for user to enter the code.
class AuthOtpSent extends AuthState {
  const AuthOtpSent(this.email);
  final String email;
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final AppUser user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}

// ── Auth Notifier ─────────────────────────────────────────────

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthInitial();

  AuthRepository get _repository => ref.read(authRepositoryProvider);

  /// Called on app start — checks if a valid session exists.
  Future<void> checkSession() async {
    state = const AuthLoading();
    try {
      final user = await _repository
          .getCurrentUser()
          .timeout(const Duration(seconds: 6));
      state = user != null
          ? AuthAuthenticated(user)
          : const AuthUnauthenticated();
    } catch (_) {
      state = const AuthUnauthenticated();
    }
  }

  /// Step 1 — request OTP; transitions to [AuthOtpSent] on success.
  Future<void> requestOtp({required String email}) async {
    state = const AuthLoading();
    try {
      await _repository.requestOtp(email: email);
      state = AuthOtpSent(email);
    } catch (e) {
      state = AuthError(_parseError(e));
    }
  }

  /// Step 2 — verify OTP; transitions to [AuthAuthenticated] on success.
  Future<void> verifyOtp({
    required String email,
    required String otp,
    String? role,
    bool rememberMe = false,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _repository.verifyOtp(
        email: email,
        otp: otp,
        role: role,
        rememberMe: rememberMe,
      );
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(_parseError(e));
    }
  }

  /// Google Sign-In: uses Firebase Auth's built-in Google provider.
  /// No separate google_sign_in package required — firebase_auth handles
  /// the native account picker via Google Play Services on Android.
  Future<void> googleSignIn({required String role}) async {
    state = const AuthLoading();
    try {
      // 1. Trigger the native Google account picker via Firebase Auth.
      final userCredential = await FirebaseAuth.instance
          .signInWithProvider(GoogleAuthProvider());

      // 2. Get a short-lived Firebase ID token to authenticate with our backend.
      final idToken = await userCredential.user?.getIdToken();
      if (idToken == null) throw Exception('Failed to obtain Firebase token');

      // 3. Send the token to our backend to create/retrieve the user.
      final user = await _repository.googleSignIn(
        firebaseToken: idToken,
        role: role,
      );
      state = AuthAuthenticated(user);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'web-context-cancelled' ||
          e.code == 'canceled' ||
          e.code == 'user-cancelled') {
        state = const AuthUnauthenticated();
        return;
      }
      state = AuthError(e.message ?? e.code);
    } catch (e) {
      state = AuthError(_parseError(e));
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthUnauthenticated();
  }

  /// Called by auth interceptor when refresh fails mid-session.
  void forceLogout() {
    state = const AuthUnauthenticated();
  }

  bool get isAuthenticated => state is AuthAuthenticated;

  AppUser? get currentUser =>
      state is AuthAuthenticated ? (state as AuthAuthenticated).user : null;

  String _parseError(Object e) {
    return e.toString().replaceAll('Exception: ', '');
  }
}

// ── Provider ──────────────────────────────────────────────────

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
