import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = (ref.watch(authProvider) as AuthAuthenticated?)?.user;
    if (user == null) return const SizedBox.shrink();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/profile/edit'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar
          Center(
            child: CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.primaryLight,
              child: Text(
                user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : '?',
                style: const TextStyle(
                  fontSize: 32,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(child: Text(user.fullName, style: AppTextStyles.title)),
          const SizedBox(height: 4),
          Center(child: Text(user.email, style: AppTextStyles.bodySecondary)),
          const SizedBox(height: 4),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                user.role,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          const Divider(),

          ListTile(
            leading: const Icon(Icons.phone_outlined),
            title: Text(user.phone ?? 'Add phone number'),
            subtitle: const Text('Phone'),
          ),
          if (user.locationCity != null)
            ListTile(
              leading: const Icon(Icons.location_on_outlined),
              title: Text(user.locationCity!),
              subtitle: const Text('City'),
            ),
          const Divider(),
          const SizedBox(height: 16),

          OutlinedButton.icon(
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text(
              'Sign Out',
              style: TextStyle(color: AppColors.error),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.error),
            ),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
