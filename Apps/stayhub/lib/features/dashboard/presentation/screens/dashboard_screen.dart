import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = (ref.watch(authProvider) as AuthAuthenticated?)?.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Welcome, ${user?.firstName ?? ''}', style: AppTextStyles.heading),
          const SizedBox(height: 20),

          // Stats row (placeholders)
          Row(
            children: [
              _StatCard(label: 'Active Listings', value: '—'),
              const SizedBox(width: 12),
              _StatCard(label: 'Total Views', value: '—'),
              const SizedBox(width: 12),
              _StatCard(label: 'Contacts', value: '—'),
            ],
          ),
          const SizedBox(height: 24),

          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add New Property'),
            onPressed: () {}, // will navigate to add property wizard
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
            const SizedBox(height: 2),
            Text(label, style: AppTextStyles.caption),
          ],
        ),
      ),
    );
  }
}
