import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/welcome_components.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AuthState>(authProvider, (_, next) {
      if (next is AuthAuthenticated) context.go(RouteNames.home);
    });

    final isLoading = ref.watch(authProvider) is AuthLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              // ── Top section: logo + headline + illustration ───
              Expanded(
                flex: 5,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo + Brand
                    const WelcomeLogo(),
                    const SizedBox(height: 20),

                    // Headline
                    const Text(
                      'Trusted by Owners.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                        height: 1.2,
                      ),
                    ),
                    const Text(
                      'Loved by Renters.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Verified properties. Trusted owners.\nHassle-free renting.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Illustration — fills remaining space in this section
                    const Expanded(child: WelcomeHouseIllustration()),
                  ],
                ),
              ),

              // ── Bottom section: buttons + footer ─────────────
              Expanded(
                flex: 4,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Auth buttons
                    AuthButton(
                      onTap: isLoading
                          ? null
                          : () => context.push('/login/phone'),
                      icon: const PhoneIcon(),
                      label: 'Continue with Phone',
                      borderColor: AppColors.primary,
                      labelColor: AppColors.primary,
                    ),
                    const SizedBox(height: 10),

                    AuthButton(
                      onTap: isLoading
                          ? null
                          : () => _googleSignIn(context, ref),
                      icon: const GoogleIcon(),
                      label: 'Continue with Google',
                      borderColor: const Color(0xFFE2E8F0),
                      labelColor: const Color(0xFF0F172A),
                      trailing: isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary),
                            )
                          : null,
                    ),
                    const SizedBox(height: 18),

                    // OR divider
                    Row(
                      children: [
                        const Expanded(
                            child: Divider(color: Color(0xFFE2E8F0))),
                        Padding(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            'OR',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade400,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const Expanded(
                            child: Divider(color: Color(0xFFE2E8F0))),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Login with Email
                    GestureDetector(
                      onTap: isLoading
                          ? null
                          : () => context.push('/login/email'),
                      child: const Text(
                        'Login with Email',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Sign Up Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Don't have an account? ",
                          style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: isLoading ? null : () => context.push(RouteNames.register),
                          child: const Text(
                            'Sign Up',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Terms footer
                    const WelcomeTermsFooter(),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _googleSignIn(BuildContext context, WidgetRef ref) {
    // Show role picker — user selects Tenant or Owner before signing in.
    // For existing accounts the server ignores the role and uses the
    // registered one, so this only matters for brand-new signups.
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => RolePickerSheet(
        onSelected: (role) {
          Navigator.pop(context);
          ref.read(authProvider.notifier).googleSignIn(role: role);
        },
      ),
    );
  }
}
