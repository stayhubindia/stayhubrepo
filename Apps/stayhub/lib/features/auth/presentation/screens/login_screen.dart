import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../providers/auth_provider.dart';

enum AuthMethod { email, phone }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.initialMethod = AuthMethod.email});
  
  final AuthMethod initialMethod;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late AuthMethod _authMethod;

  // ── Email State ─────────────────────────────────────────────
  final _emailFormKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _emailOtpFormKey = GlobalKey<FormState>();
  final _emailOtpCtrl = TextEditingController();
  String? _sentToEmail;

  // ── Phone State ─────────────────────────────────────────────
  final _phoneFormKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();
  final _phoneOtpFormKey = GlobalKey<FormState>();
  final _phoneOtpCtrl = TextEditingController();
  String? _verificationId;
  bool _isFirebaseLoading = false;

  // ── Shared State ────────────────────────────────────────────
  String _selectedRole = 'TENANT';

  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _authMethod = widget.initialMethod;
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));

    _animCtrl.forward();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _emailOtpCtrl.dispose();
    _phoneCtrl.dispose();
    _phoneOtpCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(msg)),
          ],
        ),
        backgroundColor: Colors.redAccent.shade400,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(20),
        elevation: 8,
      ),
    );
  }

  // ── Email Logic ─────────────────────────────────────────────
  void _requestEmailOtp() {
    if (!_emailFormKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).requestOtp(
          email: _emailCtrl.text.trim(),
        );
  }

  void _verifyEmailOtp() {
    if (!_emailOtpFormKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).verifyOtp(
          email: _sentToEmail!,
          otp: _emailOtpCtrl.text.trim(),
          role: _selectedRole,
        );
  }

  void _goBackToEmail() {
    _emailOtpCtrl.clear();
    setState(() => _sentToEmail = null);
    final current = ref.read(authProvider);
    if (current is AuthError || current is AuthLoading) {
      ref.read(authProvider.notifier).forceLogout();
    }
  }

  // ── Phone Logic ─────────────────────────────────────────────
  Future<void> _requestPhoneOtp() async {
    if (!_phoneFormKey.currentState!.validate()) return;

    setState(() => _isFirebaseLoading = true);

    String phone = _phoneCtrl.text.trim();
    if (!phone.startsWith('+')) {
      phone = '+91$phone'; // Defaulting to India country code if not provided
    }

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _signInWithFirebaseCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          setState(() => _isFirebaseLoading = false);
          _showError(e.message ?? 'Verification failed');
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() {
            _verificationId = verificationId;
            _isFirebaseLoading = false;
          });
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      setState(() => _isFirebaseLoading = false);
      _showError('Failed to send OTP: $e');
    }
  }

  Future<void> _verifyPhoneOtp() async {
    if (!_phoneOtpFormKey.currentState!.validate()) return;
    if (_verificationId == null) return;

    setState(() => _isFirebaseLoading = true);
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: _phoneOtpCtrl.text.trim(),
      );
      await _signInWithFirebaseCredential(credential);
    } on FirebaseAuthException catch (e) {
      setState(() => _isFirebaseLoading = false);
      _showError(e.message ?? 'Invalid OTP');
    } catch (e) {
      setState(() => _isFirebaseLoading = false);
      _showError('Failed to verify OTP');
    }
  }

  Future<void> _signInWithFirebaseCredential(PhoneAuthCredential credential) async {
    try {
      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final firebaseIdToken = await userCredential.user?.getIdToken();
      if (firebaseIdToken == null) throw Exception('Failed to obtain Firebase token');

      // Hand over to AuthProvider to communicate with our Django backend
      await ref.read(authProvider.notifier).firebaseSignIn(
            firebaseToken: firebaseIdToken,
            role: _selectedRole,
          );
    } catch (e) {
      setState(() => _isFirebaseLoading = false);
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  void _goBackToPhone() {
    _phoneOtpCtrl.clear();
    setState(() {
      _verificationId = null;
      _isFirebaseLoading = false;
    });
  }

  // ── UI Builder ──────────────────────────────────────────────

  Widget _buildActiveForm(bool isLoading) {
    if (_authMethod == AuthMethod.email) {
      if (_sentToEmail != null) {
        return _OtpForm(
          key: const ValueKey('email_otp_step'),
          formKey: _emailOtpFormKey,
          otpCtrl: _emailOtpCtrl,
          selectedRole: _selectedRole,
          isLoading: isLoading,
          onRoleChanged: (v) => setState(() => _selectedRole = v),
          onSubmit: _verifyEmailOtp,
          onResend: _requestEmailOtp,
          isPhone: false,
        );
      } else {
        return _EmailForm(
          key: const ValueKey('email_step'),
          formKey: _emailFormKey,
          emailCtrl: _emailCtrl,
          isLoading: isLoading,
          onSubmit: _requestEmailOtp,
          onRegister: () => context.push(RouteNames.register),
        );
      }
    } else {
      if (_verificationId != null) {
        return _OtpForm(
          key: const ValueKey('phone_otp_step'),
          formKey: _phoneOtpFormKey,
          otpCtrl: _phoneOtpCtrl,
          selectedRole: _selectedRole,
          isLoading: isLoading,
          onRoleChanged: (v) => setState(() => _selectedRole = v),
          onSubmit: _verifyPhoneOtp,
          onResend: _requestPhoneOtp,
          isPhone: true,
        );
      } else {
        return _PhoneForm(
          key: const ValueKey('phone_step'),
          formKey: _phoneFormKey,
          phoneCtrl: _phoneCtrl,
          isLoading: isLoading,
          onSubmit: _requestPhoneOtp,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (_, next) {
      if (next is AuthAuthenticated) {
        context.go(RouteNames.home);
      } else if (next is AuthOtpSent) {
        setState(() => _sentToEmail = next.email);
      } else if (next is AuthError) {
        setState(() => _isFirebaseLoading = false);
        _showError(next.message);
      }
    });

    final authState = ref.watch(authProvider);
    final isBackendLoading = authState is AuthLoading;
    final isLoading = isBackendLoading || _isFirebaseLoading;

    final bool inOtpStep = (_authMethod == AuthMethod.email && _sentToEmail != null) ||
                           (_authMethod == AuthMethod.phone && _verificationId != null);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () {
            if (inOtpStep) {
              if (_authMethod == AuthMethod.email) {
                _goBackToEmail();
              } else {
                _goBackToPhone();
              }
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: Stack(
        children: [
          // Premium Gradient Background
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primaryDark,
                  AppColors.primary,
                  AppColors.primaryLight,
                ],
                stops: const [0.1, 0.6, 1.0],
              ),
            ),
          ),
          
          // Decorative background elements
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -100,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),

          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 20),
                      // Header Text
                      Text(
                        inOtpStep ? 'Verification' : 'Welcome Back',
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        inOtpStep 
                            ? 'Enter the code sent to your ${_authMethod == AuthMethod.email ? "email" : "phone"}.'
                            : 'Sign in to access your properties\nand messages securely.',
                        style: TextStyle(
                          fontSize: 15,
                          color: Colors.white.withValues(alpha: 0.85),
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Form Container
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(32),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 20,
                                offset: const Offset(0, -5),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.fromLTRB(28, 28, 28, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (!inOtpStep) ...[
                                _AuthMethodToggle(
                                  currentMethod: _authMethod,
                                  onMethodChanged: (method) {
                                    if (isLoading) return;
                                    setState(() => _authMethod = method);
                                  },
                                ),
                                const SizedBox(height: 28),
                              ],
                              Expanded(
                                child: SingleChildScrollView(
                                  child: AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 400),
                                    switchInCurve: Curves.easeOutBack,
                                    switchOutCurve: Curves.easeIn,
                                    child: _buildActiveForm(isLoading),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Auth Method Toggle UI ───────────────────────────────────────
class _AuthMethodToggle extends StatelessWidget {
  final AuthMethod currentMethod;
  final ValueChanged<AuthMethod> onMethodChanged;

  const _AuthMethodToggle({
    required this.currentMethod,
    required this.onMethodChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ToggleTab(
              title: 'Email',
              icon: Icons.email_rounded,
              isSelected: currentMethod == AuthMethod.email,
              onTap: () => onMethodChanged(AuthMethod.email),
            ),
          ),
          Expanded(
            child: _ToggleTab(
              title: 'Phone',
              icon: Icons.phone_rounded,
              isSelected: currentMethod == AuthMethod.phone,
              onTap: () => onMethodChanged(AuthMethod.phone),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleTab extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleTab({
    required this.title,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : [],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 15,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Email Form ──────────────────────────────────────────────────

class _EmailForm extends StatelessWidget {
  const _EmailForm({
    super.key,
    required this.formKey,
    required this.emailCtrl,
    required this.isLoading,
    required this.onSubmit,
    required this.onRegister,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailCtrl;
  final bool isLoading;
  final VoidCallback onSubmit;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Email Address',
            style: AppTextStyles.subtitle.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
            onFieldSubmitted: (_) => onSubmit(),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: 'you@example.com',
              hintStyle: const TextStyle(color: AppColors.textHint),
              prefixIcon: const Icon(Icons.email_rounded, color: AppColors.primary),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.error, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(v.trim())) {
                return 'Please enter a valid email address';
              }
              return null;
            },
          ),
          const SizedBox(height: 32),

          // Action Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 4,
                shadowColor: AppColors.primary.withValues(alpha: 0.5),
              ),
              child: isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                    )
                  : const Text(
                      'Send OTP',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                    ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Prominent Sign Up Link
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  "Don't have an account? ",
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                GestureDetector(
                  onTap: onRegister,
                  child: const Text(
                    'Sign Up Now',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ── Phone Form ──────────────────────────────────────────────────

class _PhoneForm extends StatelessWidget {
  const _PhoneForm({
    super.key,
    required this.formKey,
    required this.phoneCtrl,
    required this.isLoading,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController phoneCtrl;
  final bool isLoading;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Phone Number',
            style: AppTextStyles.subtitle.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.telephoneNumber],
            onFieldSubmitted: (_) => onSubmit(),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              hintText: 'e.g. 9876543210',
              hintStyle: const TextStyle(color: AppColors.textHint),
              prefixIcon: const Icon(Icons.phone_rounded, color: AppColors.primary),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.error, width: 1.5),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Phone number is required';
              if (v.trim().length < 10) return 'Enter a valid phone number';
              return null;
            },
          ),
          const SizedBox(height: 32),

          // Action Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 4,
                shadowColor: AppColors.primary.withValues(alpha: 0.5),
              ),
              child: isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                    )
                  : const Text(
                      'Send OTP',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                    ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}


// ── OTP Form ────────────────────────────────────────────────────

class _OtpForm extends StatefulWidget {
  const _OtpForm({
    super.key,
    required this.formKey,
    required this.otpCtrl,
    required this.selectedRole,
    required this.isLoading,
    required this.onRoleChanged,
    required this.onSubmit,
    required this.onResend,
    required this.isPhone,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController otpCtrl;
  final String selectedRole;
  final bool isLoading;
  final void Function(String) onRoleChanged;
  final VoidCallback onSubmit;
  final VoidCallback onResend;
  final bool isPhone;

  @override
  State<_OtpForm> createState() => _OtpFormState();
}

class _OtpFormState extends State<_OtpForm> {
  Timer? _timer;
  int _resendCooldown = 60;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    setState(() => _resendCooldown = 60);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCooldown > 0) {
        setState(() => _resendCooldown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _handleResend() {
    if (_resendCooldown > 0) return;
    widget.onResend();
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: widget.formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Verification Code',
            style: AppTextStyles.subtitle.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: widget.otpCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            maxLength: widget.isPhone ? 6 : 8,
            onFieldSubmitted: (_) => widget.onSubmit(),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              letterSpacing: 10,
              color: AppColors.primary,
            ),
            textAlign: TextAlign.center,
            decoration: InputDecoration(
              hintText: widget.isPhone ? '000000' : '00000000',
              hintStyle: TextStyle(
                color: AppColors.primary.withValues(alpha: 0.3),
                letterSpacing: 10,
              ),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.primary, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.error, width: 1.5),
              ),
              counterText: '',
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Code is required';
              if (widget.isPhone && v.trim().length != 6) return 'Enter a 6-digit code';
              if (!widget.isPhone && !RegExp(r'^\d{4,8}$').hasMatch(v.trim())) {
                return 'Enter valid digits';
              }
              return null;
            },
          ),
          const SizedBox(height: 28),

          Text(
            'I am a...',
            style: AppTextStyles.subtitle.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          _RoleSelection(selected: widget.selectedRole, onChanged: widget.onRoleChanged),
          
          const SizedBox(height: 36),

          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: widget.isLoading ? null : widget.onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 4,
                shadowColor: AppColors.primary.withValues(alpha: 0.5),
              ),
              child: widget.isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                    )
                  : const Text(
                      'Verify & Sign In',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                    ),
            ),
          ),

          const SizedBox(height: 24),
          Center(
            child: TextButton(
              onPressed: widget.isLoading || _resendCooldown > 0 ? null : _handleResend,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text(
                _resendCooldown > 0 
                  ? "Resend code in ${_resendCooldown}s"
                  : "Didn't receive code? Resend",
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ── Role Selection UI ──────────────────────────────────────────

class _RoleSelection extends StatelessWidget {
  const _RoleSelection({required this.selected, required this.onChanged});

  final String selected;
  final void Function(String) onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _PremiumRoleCard(
          title: 'Tenant',
          subtitle: 'Find rentals',
          icon: Icons.key_rounded,
          isSelected: selected == 'TENANT',
          onTap: () => onChanged('TENANT'),
        ),
        const SizedBox(width: 16),
        _PremiumRoleCard(
          title: 'Owner',
          subtitle: 'List property',
          icon: Icons.domain_rounded,
          isSelected: selected == 'OWNER',
          onTap: () => onChanged('OWNER'),
        ),
      ],
    );
  }
}

class _PremiumRoleCard extends StatelessWidget {
  const _PremiumRoleCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: 1.5,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    )
                  ]
                : [],
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : AppColors.textHint,
                size: 28,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: isSelected ? Colors.white70 : AppColors.textHint,
                  fontWeight: FontWeight.w500,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
