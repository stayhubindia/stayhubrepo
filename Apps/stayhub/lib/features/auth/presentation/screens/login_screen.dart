import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  // ── Step 1: Email entry ─────────────────────────────────────
  final _emailFormKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();

  // ── Step 2: OTP entry ───────────────────────────────────────
  final _otpFormKey = GlobalKey<FormState>();
  final _otpCtrl = TextEditingController();

  String? _sentToEmail;
  String _selectedRole = 'TENANT';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _requestOtp() {
    if (!_emailFormKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).requestOtp(
          email: _emailCtrl.text.trim(),
        );
  }

  void _verifyOtp() {
    if (!_otpFormKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).verifyOtp(
          email: _sentToEmail!,
          otp: _otpCtrl.text.trim(),
          role: _selectedRole,
        );
  }

  void _goBackToEmail() {
    _otpCtrl.clear();
    setState(() => _sentToEmail = null);
    // Reset error state if any
    final current = ref.read(authProvider);
    if (current is AuthError || current is AuthLoading) {
      ref.read(authProvider.notifier).forceLogout();
    }
  }

  void _googleSignIn() {
    ref.read(authProvider.notifier).googleSignIn(role: _selectedRole);
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (_, next) {
      if (next is AuthAuthenticated) {
        context.go(RouteNames.home);
      } else if (next is AuthOtpSent) {
        setState(() => _sentToEmail = next.email);
      } else if (next is AuthError) {
        _showError(next.message);
      }
    });

    final authState = ref.watch(authProvider);
    final isLoading = authState is AuthLoading;
    final inOtpStep = _sentToEmail != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Hero header ────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 40,
                left: 28,
                right: 28,
                bottom: 40,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (inOtpStep)
                    GestureDetector(
                      onTap: isLoading ? null : _goBackToEmail,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.arrow_back_rounded,
                            color: Colors.white, size: 20),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    inOtpStep ? 'Check your email' : 'Welcome to StayHub',
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.15,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    inOtpStep
                        ? 'Enter the code sent to $_sentToEmail'
                        : 'Sign in — no password needed',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.78),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Form ──────────────────────────────────────────────
          SliverFillRemaining(
            hasScrollBody: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
              child: inOtpStep
                  ? _OtpStep(
                      formKey: _otpFormKey,
                      otpCtrl: _otpCtrl,
                      email: _sentToEmail!,
                      selectedRole: _selectedRole,
                      isLoading: isLoading,
                      onRoleChanged: (v) => setState(() => _selectedRole = v),
                      onSubmit: _verifyOtp,
                      onResend: _requestOtp,
                    )
                  : _EmailStep(
                      formKey: _emailFormKey,
                      emailCtrl: _emailCtrl,
                      isLoading: isLoading,
                      onSubmit: _requestOtp,
                      onRegister: () => context.push(RouteNames.register),
                      onGoogleSignIn: _googleSignIn,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 1 widget ──────────────────────────────────────────────

class _EmailStep extends StatelessWidget {
  const _EmailStep({
    required this.formKey,
    required this.emailCtrl,
    required this.isLoading,
    required this.onSubmit,
    required this.onRegister,
    required this.onGoogleSignIn,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailCtrl;
  final bool isLoading;
  final VoidCallback onSubmit;
  final VoidCallback onRegister;
  final VoidCallback onGoogleSignIn;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your email address',
              style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
          const SizedBox(height: 16),

          TextFormField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.email],
            onFieldSubmitted: (_) => onSubmit(),
            decoration: const InputDecoration(
              labelText: 'Email address',
              hintText: 'you@example.com',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              if (!RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(v.trim())) {
                return 'Enter a valid email';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: isLoading ? null : onSubmit,
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text('Send OTP'),
          ),

          const SizedBox(height: 24),
          Row(
            children: [
              const Expanded(child: Divider()),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('or',
                    style: AppTextStyles.caption
                        .copyWith(color: AppColors.textHint)),
              ),
              const Expanded(child: Divider()),
            ],
          ),
          const SizedBox(height: 24),

          // ── Google Sign-In ────────────────────────────
          OutlinedButton.icon(
            onPressed: isLoading ? null : onGoogleSignIn,
            icon: const Icon(Icons.g_mobiledata, size: 28),
            label: const Text('Continue with Google'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              side: BorderSide(color: Colors.grey.shade300),
              foregroundColor: AppColors.textPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),

          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("Don't have an account? ",
                  style: AppTextStyles.bodySecondary),
              GestureDetector(
                onTap: onRegister,
                child: Text(
                  'Sign Up',
                  style: AppTextStyles.bodySecondary.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Step 2 widget ──────────────────────────────────────────────

class _OtpStep extends StatelessWidget {
  const _OtpStep({
    required this.formKey,
    required this.otpCtrl,
    required this.email,
    required this.selectedRole,
    required this.isLoading,
    required this.onRoleChanged,
    required this.onSubmit,
    required this.onResend,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController otpCtrl;
  final String email;
  final String selectedRole;
  final bool isLoading;
  final void Function(String) onRoleChanged;
  final VoidCallback onSubmit;
  final VoidCallback onResend;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Verification code',
              style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
          const SizedBox(height: 16),

          TextFormField(
            controller: otpCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            maxLength: 8,
            onFieldSubmitted: (_) => onSubmit(),
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              letterSpacing: 8,
            ),
            decoration: const InputDecoration(
              labelText: 'OTP code',
              hintText: '000000',
              prefixIcon: Icon(Icons.pin_outlined),
              counterText: '',
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'OTP is required';
              if (!RegExp(r'^\d{4,8}$').hasMatch(v.trim())) {
                return 'Enter the 4–8 digit code';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),

          Text('I am a…',
              style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
          const SizedBox(height: 10),
          _RoleToggle(selected: selectedRole, onChanged: onRoleChanged),
          const SizedBox(height: 28),

          ElevatedButton(
            onPressed: isLoading ? null : onSubmit,
            child: isLoading
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2.5),
                  )
                : const Text('Verify & Sign In'),
          ),

          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: isLoading ? null : onResend,
              child: Text(
                "Didn't receive it? Resend",
                style: AppTextStyles.caption.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const Spacer(),
        ],
      ),
    );
  }
}

// ── Role toggle ────────────────────────────────────────────────

class _RoleToggle extends StatelessWidget {
  const _RoleToggle({required this.selected, required this.onChanged});

  final String selected;
  final void Function(String) onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _RoleTile(
          label: 'Tenant',
          icon: Icons.search_rounded,
          value: 'TENANT',
          selected: selected == 'TENANT',
          onTap: () => onChanged('TENANT'),
        ),
        const SizedBox(width: 12),
        _RoleTile(
          label: 'Owner',
          icon: Icons.home_work_outlined,
          value: 'OWNER',
          selected: selected == 'OWNER',
          onTap: () => onChanged('OWNER'),
        ),
      ],
    );
  }
}

class _RoleTile extends StatelessWidget {
  const _RoleTile({
    required this.label,
    required this.icon,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primary.withValues(alpha: 0.1)
                : AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: selected ? AppColors.primary : AppColors.textHint,
                  size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: AppTextStyles.caption.copyWith(
                  color: selected
                      ? AppColors.primary
                      : AppColors.textSecondary,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

