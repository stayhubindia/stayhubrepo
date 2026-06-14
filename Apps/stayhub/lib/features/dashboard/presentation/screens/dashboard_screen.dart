import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../properties/data/properties_api_client.dart';
import '../../../properties/presentation/widgets/property_card.dart';
import '../../../../core/di/providers.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final statsAsync = ref.watch(dashboardStatsProvider);
    final listingsAsync = ref.watch(myListingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider);
          ref.invalidate(myListingsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(28),
                    bottomRight: Radius.circular(28),
                  ),
                ),
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 16,
                  left: 20,
                  right: 20,
                  bottom: 28,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Dashboard',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.notifications_outlined,
                              color: Colors.white, size: 22),
                          onPressed: () => context.push('/notifications'),
                          style: IconButton.styleFrom(
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.15),
                            padding: const EdgeInsets.all(8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Welcome back,',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withValues(alpha: 0.75),
                      ),
                    ),
                    Text(
                      user?.firstName ?? 'Owner',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.4,
                        height: 1.15,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Stats ────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: statsAsync.when(
                  loading: () => _StatsShimmer(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (stats) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Overview', style: AppTextStyles.heading),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              label: 'Total Listings',
                              value: '${stats.totalListings}',
                              icon: Icons.home_outlined,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              label: 'Active',
                              value: '${stats.activeListings}',
                              icon: Icons.check_circle_outline,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              label: 'Total Views',
                              value: '${stats.totalViews}',
                              icon: Icons.visibility_outlined,
                              color: AppColors.info,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              label: 'Contacts',
                              value: '${stats.totalContacts}',
                              icon: Icons.person_add_outlined,
                              color: AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                context.push('/dashboard/tours');
                              },
                              child: _StatCard(
                                label: 'Tour Requests',
                                value: '3 New',
                                icon: Icons.calendar_month_rounded,
                                color: const Color(0xFF8B5CF6), // Purple color
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(child: SizedBox.shrink()),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Add property CTA ─────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Add New Property'),
                  onPressed: () => context.push('/dashboard/listings/add'),
                ),
              ),
            ),

            // ── My Listings ──────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Text('My Listings', style: AppTextStyles.heading),
              ),
            ),

            listingsAsync.when(
              loading: () => SliverToBoxAdapter(child: _ListingsShimmer()),
              error: (e, _) => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.textHint),
                      const SizedBox(height: 12),
                      Text(e.toString(),
                          style: AppTextStyles.bodySecondary,
                          textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () => ref.invalidate(myListingsProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (data) {
                if (data.results.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.home_outlined,
                                size: 48, color: AppColors.primary),
                          ),
                          const SizedBox(height: 16),
                          Text('No listings yet',
                              style: AppTextStyles.subtitle),
                          const SizedBox(height: 8),
                          Text(
                            'Add your first property to start getting tenants.',
                            style: AppTextStyles.bodySecondary,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _OwnerPropertyCard(
                          property: data.results[i],
                          onSubmit: () async {
                            try {
                              final api = PropertiesApiClient(
                                  ref.read(dioProvider));
                              await api
                                  .submitProperty(data.results[i].id);
                              ref.invalidate(myListingsProvider);
                              ref.invalidate(dashboardStatsProvider);
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(e
                                        .toString()
                                        .replaceAll('Exception: ', '')),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            }
                          },
                        ),
                      ),
                      childCount: data.results.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stat card ──────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: AppColors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              Text(label, style: AppTextStyles.caption),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Owner property card (with submit action) ───────────────────

class _OwnerPropertyCard extends StatelessWidget {
  const _OwnerPropertyCard(
      {required this.property, required this.onSubmit});

  final dynamic property;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        PropertyCard(property: property),
        if (property.status == 'DRAFT')
          Positioned(
            bottom: 12,
            right: 12,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ElevatedButton.icon(
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Edit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  onPressed: () => context.push('/dashboard/listings/${property.id}/edit'),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  icon: const Icon(Icons.send_outlined, size: 16),
                  label: const Text('Submit for Review'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    textStyle: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  onPressed: onSubmit,
                ),
              ],
            ),
          )
        else
          Positioned(
            top: 12,
            right: 12,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined, color: AppColors.primary),
              style: IconButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.9),
                padding: const EdgeInsets.all(8),
              ),
              onPressed: () => context.push('/dashboard/listings/${property.id}/edit'),
            ),
          ),
      ],
    );
  }
}

// ── Shimmer placeholders ───────────────────────────────────────

class _StatsShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
            width: 100,
            height: 20,
            decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(4))),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14))),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(14))),
            ),
          ],
        ),
      ],
    );
  }
}

class _ListingsShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: List.generate(
          2,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
