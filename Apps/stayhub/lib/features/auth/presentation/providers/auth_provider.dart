import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart' as gsi;
import '../../domain/entities/app_user.dart';
import '../../domain/auth_repository.dart';
import '../../../../core/di/providers.dart';
import 'onboarding_provider.dart';

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

  /// Helper to automatically skip onboarding for existing users logging in on a new device.
  void _checkSkipOnboarding(AppUser user) {
    if (user.dateJoined != null) {
      final diff = DateTime.now().toUtc().difference(user.dateJoined!);
      if (diff.inMinutes > 5) {
        ref.read(onboardingProvider.notifier).completeOnboarding();
      }
    }
  }

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
      _checkSkipOnboarding(user);
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError(_parseError(e));
    }
  }

  /// Google Sign-In: uses the native Google Play Services account picker.
  /// [role] is only sent for NEW accounts. For existing accounts the server
  /// ignores the role and uses the one already registered.
  Future<void> googleSignIn({String? role}) async {
    state = const AuthLoading();
    try {
      final gsiInstance = gsi.GoogleSignIn.instance;
      await gsiInstance.initialize();

      final googleUser = await gsiInstance.authenticate();

      final idToken = googleUser.authentication.idToken;
      if (idToken == null) throw Exception('Failed to obtain Google ID token');

      final credential = GoogleAuthProvider.credential(idToken: idToken);
      final userCredential =
          await FirebaseAuth.instance.signInWithCredential(credential);

      final firebaseIdToken = await userCredential.user?.getIdToken();
      if (firebaseIdToken == null) {
        throw Exception('Failed to obtain Firebase token');
      }

      // Send role only when provided (new user signup).
      // For existing users omit it — server uses their registered role.
      final user = await _repository.googleSignIn(
        firebaseToken: firebaseIdToken,
        role: role ?? 'TENANT', // fallback only for brand-new accounts
      );
      _checkSkipOnboarding(user);
      state = AuthAuthenticated(user);
    } on gsi.GoogleSignInException catch (e) {
      if (e.code == gsi.GoogleSignInExceptionCode.canceled) {
        state = const AuthUnauthenticated();
        return;
      }
      state = AuthError(e.description ?? e.code.toString());
    } on FirebaseAuthException catch (e) {
      state = AuthError(e.message ?? e.code);
    } catch (e) {
      // If server returns role conflict error, surface it clearly
      final msg = _parseError(e);
      if (msg.contains('already registered as')) {
        state = AuthError(msg);
      } else {
        state = AuthError(msg);
      }
    }
  }

  /// Generic Firebase sign-in for Phone Auth (or any other provider).
  Future<void> firebaseSignIn({
    required String firebaseToken,
    required String role,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _repository.googleSignIn(
        firebaseToken: firebaseToken,
        role: role,
      );
      _checkSkipOnboarding(user);
      state = AuthAuthenticated(user);
    } catch (e) {
      final msg = _parseError(e);
      state = AuthError(msg);
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    // Also sign out of Google so the account picker shows next time.
    await gsi.GoogleSignIn.instance.signOut();
    state = const AuthUnauthenticated();
  }

  /// Called by auth interceptor when refresh fails mid-session.
  void forceLogout() {
    state = const AuthUnauthenticated();
  }

  /// Updates the in-memory user after a profile edit.
  void refreshUser(AppUser updated) {
    state = AuthAuthenticated(updated);
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
