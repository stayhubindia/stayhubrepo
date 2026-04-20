import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const _categories = [
    {'label': 'PG', 'icon': Icons.bed_outlined},
    {'label': '1BHK', 'icon': Icons.meeting_room_outlined},
    {'label': '2BHK', 'icon': Icons.home_outlined},
    {'label': '3BHK', 'icon': Icons.villa_outlined},
    {'label': 'House', 'icon': Icons.house_outlined},
    {'label': 'Commercial', 'icon': Icons.store_outlined},
  ];

  static const _cities = [
    'Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = (ref.watch(authProvider) as AuthAuthenticated?)?.user;
    final firstName = user?.firstName ?? 'there';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── Hero banner ──────────────────────────────────────
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
                  // Top row
                  Row(
                    children: [
                      const Text(
                        'StayHub',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
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
                  const SizedBox(height: 24),

                  // Greeting
                  Text(
                    '$greeting,',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.75),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  Text(
                    firstName,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.4,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Search bar
                  GestureDetector(
                    onTap: () => context.push('/properties'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: AppColors.elevatedShadow,
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search,
                              color: AppColors.textHint, size: 20),
                          const SizedBox(width: 10),
                          Text(
                            'Search city, locality, type…',
                            style: AppTextStyles.body
                                .copyWith(color: AppColors.textHint),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'Search',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
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

          // ── Body ─────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Category chips ──────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Browse by type', style: AppTextStyles.heading),
                    TextButton(
                      onPressed: () => context.push('/properties'),
                      style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                      child: const Text('See all'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                GridView.count(
                  crossAxisCount: 3,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.55,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: _categories.map((cat) {
                    final label = cat['label'] as String;
                    final icon = cat['icon'] as IconData;
                    return _CategoryTile(
                      label: label,
                      icon: icon,
                      onTap: () =>
                          context.push('/properties?property_type=$label'),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 32),

                // ── Popular cities ───────────────────────────
                Text('Popular cities', style: AppTextStyles.heading),
                const SizedBox(height: 14),
                SizedBox(
                  height: 44,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _cities.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) {
                      final city = _cities[i];
                      return _CityChip(
                        city: city,
                        onTap: () =>
                            context.push('/properties?city=$city'),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 32),

                // ── Quick stats banner ───────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primaryLight),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _StatItem(
                            value: '5000+', label: 'Properties'),
                      ),
                      Container(
                          width: 1, height: 40, color: AppColors.border),
                      Expanded(
                        child: _StatItem(value: '0', label: 'Brokerage'),
                      ),
                      Container(
                          width: 1, height: 40, color: AppColors.border),
                      Expanded(
                        child: _StatItem(value: '20+', label: 'Cities'),
                      ),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile(
      {required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: AppColors.primary, size: 18),
            ),
            const SizedBox(height: 6),
            Text(label, style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _CityChip extends StatelessWidget {
  const _CityChip({required this.city, required this.onTap});
  final String city;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          boxShadow: AppColors.cardShadow,
          border: Border.all(color: AppColors.border),
        ),
        child: Text(city,
            style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryDark,
            )),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}


class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = (ref.watch(authProvider) as AuthAuthenticated?)?.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('StayHub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Greeting
          Text(
            'Hello, ${user?.firstName ?? 'there'} 👋',
            style: AppTextStyles.heading,
          ),
          const SizedBox(height: 4),
          Text(
            'Find your next home in minutes.',
            style: AppTextStyles.bodySecondary,
          ),
          const SizedBox(height: 20),

          // Search bar shortcut
          GestureDetector(
            onTap: () => context.push('/properties'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.textHint),
                  const SizedBox(width: 10),
                  Text('Search city, locality…',
                      style: AppTextStyles.body
                          .copyWith(color: AppColors.textHint)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),

          // Category chips
          Text('Browse by type', style: AppTextStyles.subtitle),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              'PG', '1BHK', '2BHK', '3BHK', 'House', 'Commercial'
            ]
                .map(
                  (t) => ActionChip(
                    label: Text(t),
                    onPressed: () =>
                        context.push('/properties?property_type=$t'),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 28),

          // Popular cities
          Text('Popular cities', style: AppTextStyles.subtitle),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              'Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai'
            ]
                .map(
                  (c) => ActionChip(
                    label: Text(c),
                    onPressed: () => context.push('/properties?city=$c'),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}
