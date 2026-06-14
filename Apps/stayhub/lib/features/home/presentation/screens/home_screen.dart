import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../properties/domain/entities/property.dart';
import '../providers/home_provider.dart';
import '../providers/location_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final isOwner = user?.isOwner ?? false;
    return isOwner
        ? _OwnerHomeScreen(firstName: user?.firstName ?? 'Owner')
        : _TenantHomeScreen(firstName: user?.firstName);
  }
}

String _getGreeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

SliverAppBar _buildAppBar(BuildContext context) {
  return SliverAppBar(
    floating: true,
    snap: true,
    backgroundColor: AppColors.surface,
    surfaceTintColor: Colors.transparent,
    elevation: 0,
    titleSpacing: 16,
    title: Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Center(
            child: Text(
              'S',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text('StayHub',
            style: AppTextStyles.title.copyWith(color: AppColors.textPrimary)),
      ],
    ),
    actions: [
      IconButton(
        icon: const Icon(Icons.notifications_outlined),
        color: AppColors.textPrimary,
        onPressed: () => context.push('/notifications'),
      ),
      const SizedBox(width: 4),
    ],
    bottom: PreferredSize(
      preferredSize: const Size.fromHeight(1),
      child: Container(height: 1, color: AppColors.border),
    ),
  );
}

// ── Owner Home ────────────────────────────────────────────────

class _OwnerHomeScreen extends ConsumerWidget {
  const _OwnerHomeScreen({required this.firstName});
  final String firstName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(ownerStatsProvider);
    final listingsAsync = ref.watch(myListingsHomeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(context),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome banner
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF16A34A), Color(0xFF14532D)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: AppColors.elevatedShadow,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${_getGreeting()},',
                                style: AppTextStyles.caption
                                    .copyWith(color: Colors.white70)),
                            const SizedBox(height: 2),
                            Text(firstName,
                                style: AppTextStyles.heading
                                    .copyWith(color: Colors.white)),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () =>
                                  context.push('/dashboard/listings/add'),
                              icon: const Icon(Icons.add, size: 16),
                              label: const Text('Add Property'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                                elevation: 0,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.home_work_outlined,
                            color: Colors.white, size: 36),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Stats
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: statsAsync.when(
                    data: (stats) => Row(
                      children: [
                        _StatCard(label: 'Listings', value: '${stats.totalListings}', icon: Icons.home_work_outlined, color: AppColors.primary),
                        const SizedBox(width: 10),
                        _StatCard(label: 'Active', value: '${stats.activeListings}', icon: Icons.check_circle_outline, color: AppColors.success),
                        const SizedBox(width: 10),
                        _StatCard(label: 'Views', value: '${stats.totalViews}', icon: Icons.visibility_outlined, color: AppColors.info),
                        const SizedBox(width: 10),
                        _StatCard(label: 'Contacts', value: '${stats.totalContacts}', icon: Icons.phone_outlined, color: AppColors.warning),
                      ],
                    ),
                    loading: () => const _StatsShimmer(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(height: 20),

                // Quick actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _QuickAction(icon: Icons.add_home_outlined, label: 'Add\nProperty', onTap: () => context.push('/dashboard/listings/add')),
                      _QuickAction(icon: Icons.dashboard_outlined, label: 'Dashboard', onTap: () => context.go('/dashboard')),
                      _QuickAction(icon: Icons.chat_bubble_outline, label: 'Messages', onTap: () => context.go('/chats')),
                      _QuickAction(icon: Icons.person_outline, label: 'Profile', onTap: () => context.go('/profile')),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // My listings
                _SectionHeader(title: 'My Listings', onSeeAll: () => context.go('/dashboard')),
                const SizedBox(height: 12),
                listingsAsync.when(
                  data: (props) => props.isEmpty
                      ? const _SectionEmpty(message: 'No listings yet. Add your first property!')
                      : SizedBox(
                          height: 280,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: props.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (context, i) => _HomePropertyCard(
                              property: props[i],
                              onTap: () => context.push('/properties/${props[i].id}'),
                            ),
                          ),
                        ),
                  loading: () => const _HorizontalShimmer(),
                  error: (e, _) => _SectionError(message: e.toString()),
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Tenant Home ───────────────────────────────────────────────

class _TenantHomeScreen extends ConsumerWidget {
  const _TenantHomeScreen({this.firstName});
  final String? firstName;

  static const _quickFilters = [
    (label: 'For Rent', icon: Icons.home_outlined, route: '/properties'),
    (label: 'PG/Hostel', icon: Icons.hotel_outlined, route: '/properties?property_type=PG'),
    (label: '1RK/Studio', icon: Icons.single_bed_outlined, route: '/properties?property_type=1RK'),
    (label: '1BHK', icon: Icons.bed_outlined, route: '/properties?property_type=1BHK'),
    (label: '2BHK+', icon: Icons.king_bed_outlined, route: '/properties?property_type=2BHK'),
    (label: 'More', icon: Icons.grid_view_outlined, route: '/properties'),
  ];

  static const _browseCategories = [
    (label: '1RK/Studio', icon: Icons.single_bed_outlined, route: '/properties?property_type=1RK'),
    (label: '1BHK', icon: Icons.bed_outlined, route: '/properties?property_type=1BHK'),
    (label: '2BHK', icon: Icons.king_bed_outlined, route: '/properties?property_type=2BHK'),
    (label: '3BHK+', icon: Icons.holiday_village_outlined, route: '/properties?property_type=3BHK'),
    (label: 'PG/Hostel', icon: Icons.hotel_outlined, route: '/properties?property_type=PG'),
    (label: 'Commercial', icon: Icons.storefront_outlined, route: '/properties?property_type=Commercial'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rentalAsync = ref.watch(rentalPropertiesProvider);
    final roomsAsync = ref.watch(rentalRoomsProvider);
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // New Hero App Bar
          SliverToBoxAdapter(
            child: _buildHeroSection(context, ref, firstName, locationState),
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                // OLX Style Categories
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Wrap(
                    spacing: 20,
                    runSpacing: 20,
                    alignment: WrapAlignment.start,
                    children: _browseCategories.map((cat) {
                      return _OlxCategoryItem(
                        label: cat.label,
                        icon: cat.icon,
                        onTap: () => context.push(cat.route),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Quick filters
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: _quickFilters
                        .map((f) => _QuickFilterItem(label: f.label, icon: f.icon, onTap: () => context.push(f.route)))
                        .toList(),
                  ),
                ),
                const SizedBox(height: 32),

                // Rental Properties
                _SectionHeader(title: 'Top Rated Properties', onSeeAll: () => context.push('/properties')),
                const SizedBox(height: 16),
                rentalAsync.when(
                  data: (props) => props.isEmpty
                      ? const _SectionEmpty(message: 'No properties available right now.')
                      : SizedBox(
                          height: 260,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: props.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 16),
                            itemBuilder: (context, i) => _HomePropertyCard(
                              property: props[i],
                              onTap: () => context.push('/properties/${props[i].id}'),
                            ),
                          ),
                        ),
                  loading: () => const _HorizontalShimmer(),
                  error: (e, _) => _SectionError(message: e.toString()),
                ),
                const SizedBox(height: 32),

                // Rental Rooms
                _SectionHeader(title: 'Rental Rooms', onSeeAll: () => context.push('/properties?property_type=PG')),
                const SizedBox(height: 16),
                roomsAsync.when(
                  data: (props) => props.isEmpty
                      ? const _SectionEmpty(message: 'No rooms available right now.')
                      : SizedBox(
                          height: 260,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: props.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 16),
                            itemBuilder: (context, i) => _HomePropertyCard(
                              property: props[i],
                              onTap: () => context.push('/properties/${props[i].id}'),
                            ),
                          ),
                        ),
                  loading: () => const _HorizontalShimmer(),
                  error: (e, _) => _SectionError(message: e.toString()),
                ),
                const SizedBox(height: 32),

                // Trust banner
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: _TrustBanner(),
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context, WidgetRef ref, String? firstName, LocationState locationState) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 30),
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: locationState.error != null
                        ? () => ref.read(locationProvider.notifier).resolveLocationIssue()
                        : null,
                    child: Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.white70, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          locationState.isLoading
                              ? 'Locating...'
                              : (locationState.error != null
                                  ? 'Tap to enable location'
                                  : 'Exploring in ${locationState.city}'),
                          style: AppTextStyles.label.copyWith(
                            color: Colors.white70,
                            decoration: locationState.error != null
                                ? TextDecoration.underline
                                : TextDecoration.none,
                            decorationColor: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    firstName != null ? '${_getGreeting()}, $firstName' : 'Find your next home',
                    style: AppTextStyles.display.copyWith(color: Colors.white, fontSize: 24),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () => context.push('/notifications'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Search Bar
          GestureDetector(
            onTap: () => context.push('/properties'),
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.textHint, size: 28),
                  const SizedBox(width: 12),
                  Text('Search for "2BHK in Andheri"', style: AppTextStyles.bodySecondary),
                  const Spacer(),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.tune, color: AppColors.primary, size: 20),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared Widgets ────────────────────────────────────────────

class _QuickFilterItem extends StatelessWidget {
  const _QuickFilterItem({required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.border),
            boxShadow: AppColors.cardShadow,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(label, style: AppTextStyles.label),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onSeeAll});
  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTextStyles.subtitle),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Text('See all',
                  style: AppTextStyles.label.copyWith(color: AppColors.primary)),
            ),
        ],
      ),
    );
  }
}



class _HomePropertyCard extends StatelessWidget {
  const _HomePropertyCard({required this.property, required this.onTap});
  final Property property;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = property.images.isNotEmpty ? property.images.first : null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 240, // Wider aspect ratio
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
          boxShadow: const [
            BoxShadow(color: Color(0x0A0F172A), blurRadius: 12, offset: Offset(0, 4)),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 140,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: 'property_${property.id}',
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const _CardPlaceholder(),
                            errorWidget: (_, __, ___) => const _CardPlaceholder(),
                          )
                        : const _CardPlaceholder(),
                  ),
                  // Glassmorphic type chip
                  Positioned(
                    top: 12,
                    left: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                          ),
                          child: Text(
                            property.propertyType,
                            style: AppTextStyles.overline.copyWith(color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Floating save button
                  Positioned(
                    top: 12,
                    right: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                          ),
                          child: const Icon(Icons.favorite_border, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(property.title, style: AppTextStyles.title.copyWith(fontSize: 15),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  if (property.locationCity != null)
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textHint),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(property.locationCity!, style: AppTextStyles.caption.copyWith(fontSize: 13),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text('₹${property.rent.toStringAsFixed(0)}',
                          style: AppTextStyles.price.copyWith(fontSize: 18)),
                      Text('/mo', style: AppTextStyles.caption),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CardPlaceholder extends StatelessWidget {
  const _CardPlaceholder();
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceVariant,
      child: const Center(child: Icon(Icons.home_outlined, color: AppColors.textHint, size: 32)),
    );
  }
}

class _OlxCategoryItem extends StatelessWidget {
  const _OlxCategoryItem({required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Icon(icon, color: AppColors.primary, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _TrustBanner extends StatelessWidget {
  const _TrustBanner();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.verified_outlined, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Verified Listings',
                    style: AppTextStyles.label.copyWith(color: AppColors.primaryDeep, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text('All properties are verified by our team.',
                    style: AppTextStyles.caption.copyWith(color: AppColors.primaryDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HorizontalShimmer extends StatelessWidget {
  const _HorizontalShimmer();
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 260,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (_, __) => Container(
          width: 240,
          decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}



class _SectionError extends StatelessWidget {
  const _SectionError({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.errorLight, borderRadius: BorderRadius.circular(8)),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('Failed to load. Please try again.',
                style: AppTextStyles.caption.copyWith(color: AppColors.error))),
          ],
        ),
      ),
    );
  }
}

class _SectionEmpty extends StatelessWidget {
  const _SectionEmpty({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Center(child: Text(message, style: AppTextStyles.bodySecondary, textAlign: TextAlign.center)),
    );
  }
}

// ── Owner-specific Widgets ────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: AppTextStyles.subtitle.copyWith(color: color)),
            Text(label, style: AppTextStyles.overline, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: AppColors.primary, size: 24),
            ),
            const SizedBox(height: 6),
            Text(label, style: AppTextStyles.overline, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _StatsShimmer extends StatelessWidget {
  const _StatsShimmer();
  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(4, (i) => Expanded(
        child: Container(
          margin: EdgeInsets.only(right: i < 3 ? 10 : 0),
          height: 72,
          decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(10)),
        ),
      )),
    );
  }
}
