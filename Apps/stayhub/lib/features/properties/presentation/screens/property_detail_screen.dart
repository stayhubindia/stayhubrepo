import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/presentation/providers/chat_provider.dart';
import '../../../favorites/presentation/providers/favorites_provider.dart';
import '../../domain/entities/property.dart';
import '../providers/properties_provider.dart';
import '../widgets/book_visit_bottom_sheet.dart';

class PropertyDetailScreen extends ConsumerStatefulWidget {
  const PropertyDetailScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<PropertyDetailScreen> createState() =>
      _PropertyDetailScreenState();
}

class _PropertyDetailScreenState
    extends ConsumerState<PropertyDetailScreen> {
  int _currentImageIndex = 0;
  bool _isSaving = false;
  bool _isStartingChat = false;
  bool _descExpanded = false;

  Future<void> _toggleFavorite(bool isFavorited) async {
    setState(() => _isSaving = true);
    try {
      final api = ref.read(favoritesApiClientProvider);
      if (isFavorited) {
        await api.removeFavorite(widget.propertyId);
        _snack('Removed from saved', isError: false);
      } else {
        await api.addFavorite(widget.propertyId);
        _snack('Saved to favorites', isError: false);
      }
      ref.invalidate(favoritesProvider);
      ref.invalidate(favoritePropertyIdsProvider);
    } catch (e) {
      _snack(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _startChat() async {
    setState(() => _isStartingChat = true);
    try {
      final api = ref.read(conversationsApiClientProvider);
      final conv = await api.startConversation(widget.propertyId);
      ref.invalidate(conversationsProvider);
      if (mounted) {
        final p = ref.read(propertyDetailProvider(widget.propertyId)).value;
        context.push('/chats/${conv.id}', extra: {
          'title': p?.ownerName ?? 'Owner',
          'propertyId': widget.propertyId,
          'propertyTitle': p?.title,
          'propertyRent': p?.rent,
          'propertyImage': p?.images.isNotEmpty == true ? p!.images.first : null,
          'propertyCity': p?.locationCity,
        });
      }
    } catch (e) {
      _snack(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isStartingChat = false);
    }
  }

  void _snack(String msg, {required bool isError}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.error : AppColors.success,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final propertyAsync =
        ref.watch(propertyDetailProvider(widget.propertyId));
    final favIdsAsync = ref.watch(favoritePropertyIdsProvider);
    final authState = ref.watch(authProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final isTenant = user?.isTenant ?? true;

    final isFavorited = favIdsAsync.maybeWhen(
      data: (ids) => ids.contains(widget.propertyId),
      orElse: () => false,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: propertyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 56, color: AppColors.textHint),
              const SizedBox(height: 16),
              Text('Failed to load property', style: AppTextStyles.subtitle),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: () => ref.invalidate(propertyDetailProvider(widget.propertyId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (property) {
          final images = property.images;
          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  // ── Image gallery ──────────────────────────
                  SliverToBoxAdapter(
                    child: Stack(
                      children: [
                        // Main image with Hero
                        Hero(
                          tag: 'property_${property.id}',
                          child: SizedBox(
                            height: 380, // Taller for full-bleed feel
                            child: images.isNotEmpty
                                ? PageView.builder(
                                    itemCount: images.length,
                                    onPageChanged: (i) =>
                                        setState(() => _currentImageIndex = i),
                                    itemBuilder: (_, i) => CachedNetworkImage(
                                      imageUrl: images[i],
                                      fit: BoxFit.cover,
                                      placeholder: (_, __) => Container(
                                          color: AppColors.surfaceVariant),
                                      errorWidget: (_, __, ___) => Container(
                                        color: AppColors.surfaceVariant,
                                        child: const Icon(Icons.home_outlined,
                                            size: 80, color: AppColors.textHint),
                                      ),
                                    ),
                                  )
                                : Container(
                                    color: AppColors.surfaceVariant,
                                    child: const Icon(Icons.home_outlined,
                                        size: 80, color: AppColors.textHint),
                                  ),
                          ),
                        ),
                        
                        // Bottom Gradient for smooth transition
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 80,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.black.withValues(alpha: 0.6), Colors.transparent],
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                              ),
                            ),
                          ),
                        ),

                        // Image counter badge
                        if (images.length > 1)
                          Positioned(
                            bottom: 16,
                            right: 16,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                  ),
                                  child: Text(
                                    '${_currentImageIndex + 1} / ${images.length}',
                                    style: AppTextStyles.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                            ),
                          ),

                        // Back + action buttons (Glassmorphic)
                        Positioned(
                          top: MediaQuery.of(context).padding.top + 8,
                          left: 16,
                          right: 16,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _GlassCircleButton(
                                icon: Icons.arrow_back_ios_new_rounded,
                                onTap: () => context.pop(),
                              ),
                              Row(
                                children: [
                                  _GlassCircleButton(
                                    icon: Icons.share_outlined,
                                    onTap: () {
                                      final String propertyUrl = 'https://stayhubindia.com/properties/${property.id}';
                                      Share.share(
                                        'Check out this awesome ${property.propertyType} in ${property.locationCity} on StayHub!\n\n'
                                        '${property.title}\nRent: ₹${property.rent}/month\n\n'
                                        'View details here: $propertyUrl',
                                        subject: 'StayHub Property: ${property.title}',
                                      );
                                    },
                                  ),
                                  const SizedBox(width: 10),
                                  if (isTenant)
                                    _GlassCircleButton(
                                      icon: isFavorited
                                          ? Icons.favorite_rounded
                                          : Icons.favorite_outline,
                                      iconColor: isFavorited
                                          ? AppColors.error
                                          : Colors.white,
                                      onTap: _isSaving
                                          ? null
                                          : () => _toggleFavorite(isFavorited),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Thumbnail strip ────────────────────────
                  if (images.length > 1)
                    SliverToBoxAdapter(
                      child: Container(
                        height: 80,
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: images.length > 5 ? 5 : images.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(width: 10),
                          itemBuilder: (_, i) {
                            final isLast =
                                i == 4 && images.length > 5;
                            return GestureDetector(
                              onTap: () =>
                                  setState(() => _currentImageIndex = i),
                              child: Stack(
                                children: [
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    width: 64,
                                    decoration: BoxDecoration(
                                      borderRadius:
                                          BorderRadius.circular(12),
                                      border: Border.all(
                                        color: _currentImageIndex == i
                                            ? AppColors.primary
                                            : Colors.transparent,
                                        width: 2.5,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(10),
                                      child: CachedNetworkImage(
                                        imageUrl: images[i],
                                        fit: BoxFit.cover,
                                        placeholder: (_, __) => Container(
                                            color: AppColors.surfaceVariant),
                                        errorWidget: (_, __, ___) =>
                                            Container(
                                                color:
                                                    AppColors.surfaceVariant),
                                      ),
                                    ),
                                  ),
                                  if (isLast)
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.black54,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '+${images.length - 4}',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w700),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ),

                  // ── Property info ──────────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top Info Row (Type & Verified)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(property.propertyType, style: AppTextStyles.caption.copyWith(color: AppColors.primaryDeep, fontWeight: FontWeight.bold)),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.verified_rounded,
                                      color: AppColors.primary, size: 16),
                                  const SizedBox(width: 4),
                                  Text('Verified',
                                      style: AppTextStyles.caption.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Price & Title
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${_fmt(property.rent)}',
                                style: const TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.only(bottom: 6, left: 4),
                                child: Text('/mo',
                                    style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textSecondary)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          Text(property.title,
                              style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A))),
                          const SizedBox(height: 12),

                          // Location
                          if (property.locationCity != null ||
                              property.locationAddress != null)
                            Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryLight,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.location_on, size: 20, color: AppColors.primary),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      _locationText(property),
                                      style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right, color: AppColors.textHint),
                                ],
                              ),
                            ),
                          const SizedBox(height: 16),

                          // ── Mini Map ───────────────────────
                          _MiniMap(property: property),
                          const SizedBox(height: 24),

                          // Specs row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              if (property.bedrooms != null)
                                _SpecTile(
                                  icon: Icons.king_bed_outlined,
                                  value: '${property.bedrooms}',
                                  label: 'Beds',
                                ),
                              if (property.bathrooms != null)
                                _SpecTile(
                                  icon: Icons.bathtub_outlined,
                                  value: '${property.bathrooms}',
                                  label: 'Baths',
                                ),
                              if (property.areaSqft != null)
                                _SpecTile(
                                  icon: Icons.square_foot_outlined,
                                  value: '${property.areaSqft}',
                                  label: 'Sqft',
                                ),
                              _SpecTile(
                                icon: Icons.balcony_outlined,
                                value: '1',
                                label: 'Balcony',
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),

                          // About
                          const Text('About this property',
                              style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A))),
                          const SizedBox(height: 12),
                          AnimatedSize(
                            duration: const Duration(milliseconds: 300),
                            child: Text(
                              property.description,
                              style: AppTextStyles.body.copyWith(height: 1.5),
                              maxLines: _descExpanded ? null : 3,
                              overflow: _descExpanded
                                  ? TextOverflow.visible
                                  : TextOverflow.ellipsis,
                            ),
                          ),
                          if (property.description.length > 120)
                            GestureDetector(
                              onTap: () => setState(
                                  () => _descExpanded = !_descExpanded),
                              child: Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  _descExpanded ? 'Show less' : 'Read more',
                                  style: AppTextStyles.label.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          const SizedBox(height: 32),

                          // Property details table
                          const Text('Details',
                              style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A))),
                          const SizedBox(height: 16),
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              children: [
                                _DetailRow(
                                    label: 'Furnishing',
                                    value: _furnishingLabel(property.furnishing)),
                                const Divider(height: 1),
                                _DetailRow(
                                    label: 'Property Type',
                                    value: property.propertyType),
                                if (property.availableFrom != null) ...[
                                  const Divider(height: 1),
                                  _DetailRow(
                                      label: 'Available from',
                                      value: property.availableFrom!),
                                ],
                                if (property.deposit != null) ...[
                                  const Divider(height: 1),
                                  _DetailRow(
                                      label: 'Deposit',
                                      value: '₹${_fmt(property.deposit!)}'),
                                ],
                                if (property.preferredTenant != null &&
                                    property.preferredTenant != 'ANY') ...[
                                  const Divider(height: 1),
                                  _DetailRow(
                                      label: 'Preferred Tenant',
                                      value: property.preferredTenant!),
                                ]
                              ],
                            ),
                          ),
                          const SizedBox(height: 32),

                          // Amenities
                          if (property.amenities.isNotEmpty) ...[
                            const Text('Amenities',
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A))),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: property.amenities
                                  .map((a) => _AmenityChip(label: a.name))
                                  .toList(),
                            ),
                            const SizedBox(height: 32),
                          ],

                          // Owner details
                          if (property.ownerName != null) ...[
                            const Text('Owner',
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0F172A))),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: AppColors.cardShadow,
                                border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 30,
                                    backgroundColor: AppColors.primaryLight,
                                    child: Text(
                                      property.ownerName![0].toUpperCase(),
                                      style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primary),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(property.ownerName!,
                                            style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                                color: Color(0xFF0F172A))),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.verified_rounded,
                                                size: 16,
                                                color: AppColors.primary),
                                            const SizedBox(width: 4),
                                            Text('Verified Owner',
                                                style: AppTextStyles.caption
                                                    .copyWith(
                                                        color: AppColors.primary,
                                                        fontWeight:
                                                            FontWeight.w600)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Bottom padding for CTA bar
                          const SizedBox(height: 120),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // ── Bottom CTA bar (Sticky Glassmorphic) ──────────
              if (isTenant)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: ClipRRect(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          border: Border(top: BorderSide(color: AppColors.border.withValues(alpha: 0.5))),
                        ),
                        child: Row(
                          children: [
                            // Chat button
                            Expanded(
                              child: OutlinedButton.icon(
                                icon: _isStartingChat
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: AppColors.primary))
                                    : const Icon(Icons.chat_bubble_outline_rounded,
                                        size: 20),
                                label: const Text('Chat', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                onPressed:
                                    _isStartingChat ? null : _startChat,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  backgroundColor: Colors.white.withValues(alpha: 0.5),
                                  side: const BorderSide(
                                      color: AppColors.primary, width: 1.5),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Book Tour button
                            Expanded(
                              flex: 2,
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.calendar_month_rounded, size: 20),
                                label: const Text('Book a Tour', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                onPressed: () {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (context) => BookVisitBottomSheet(propertyId: widget.propertyId),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16),
                                  elevation: 4,
                                  shadowColor: AppColors.primary.withValues(alpha: 0.4),
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
          );
        },
      ),
    );
  }

  String _fmt(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(0)},000';
    return v.toStringAsFixed(0);
  }

  String _locationText(dynamic p) {
    final parts = <String>[];
    if (p.locationAddress != null && p.locationAddress!.isNotEmpty) {
      parts.add(p.locationAddress!);
    }
    if (p.locationCity != null) parts.add(p.locationCity!);
    if (p.locationState != null) parts.add(p.locationState!);
    return parts.join(', ');
  }

  String _furnishingLabel(String f) {
    switch (f.toUpperCase()) {
      case 'FURNISHED': return 'Furnished';
      case 'SEMI': return 'Semi Furnished';
      default: return 'Unfurnished';
    }
  }
}

// ── Widgets ───────────────────────────────────────────────────

class _GlassCircleButton extends StatelessWidget {
  const _GlassCircleButton({required this.icon, this.iconColor, this.onTap});
  final IconData icon;
  final Color? iconColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            ),
            child: Icon(icon,
                size: 20, color: iconColor ?? Colors.white),
          ),
        ),
      ),
    );
  }
}

class _SpecTile extends StatelessWidget {
  const _SpecTile(
      {required this.icon, required this.value, required this.label});
  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [BoxShadow(color: Color(0x050F172A), blurRadius: 4, offset: Offset(0, 2))],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(value,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A))),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: Text(label,
                style: AppTextStyles.body
                    .copyWith(color: AppColors.textSecondary)),
          ),
          Text(value,
              style: AppTextStyles.body
                  .copyWith(fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

class _AmenityChip extends StatelessWidget {
  const _AmenityChip({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: AppColors.cardShadow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle, color: AppColors.primary, size: 16),
          const SizedBox(width: 6),
          Text(label,
              style: AppTextStyles.label
                  .copyWith(color: const Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

// ── Mini Map ──────────────────────────────────────────────────
//
// Uses Google Static Maps API to show a map tile.
// Falls back to a styled placeholder when no API key or coordinates.

class _MiniMap extends StatelessWidget {
  const _MiniMap({required this.property});

  final dynamic property;

  @override
  Widget build(BuildContext context) {
    final apiKey = AppConfig.googleMapsApiKey;
    // Safely extract latitude and longitude from the property object
    final lat = (property is Property) ? property.latitude : null;
    final lng = (property is Property) ? property.longitude : null;

    // Build location query — prefer lat/lng, fall back to address string
    String? locationQuery;
    if (lat != null && lng != null) {
      locationQuery = '$lat,$lng';
    } else {
      final parts = <String>[];
      if (property.locationAddress != null &&
          (property.locationAddress as String).isNotEmpty) {
        parts.add(property.locationAddress as String);
      }
      if (property.locationCity != null) {
        parts.add(property.locationCity as String);
      }
      if (property.locationState != null) {
        parts.add(property.locationState as String);
      }
      if (parts.isNotEmpty) locationQuery = parts.join(', ');
    }

    final hasMap = apiKey.isNotEmpty &&
        apiKey != 'YOUR_GOOGLE_MAPS_API_KEY_HERE' &&
        locationQuery != null;

    return GestureDetector(
      onTap: () {
        // Could open Google Maps app/URL here
      },
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: AppColors.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            // Map image
            if (hasMap)
              CachedNetworkImage(
                imageUrl: _buildStaticMapUrl(
                    apiKey, locationQuery, lat, lng),
                width: double.infinity,
                height: 160,
                fit: BoxFit.cover,
                placeholder: (_, __) => _MapPlaceholder(
                    locationQuery: locationQuery),
                errorWidget: (_, __, ___) => _MapPlaceholder(
                    locationQuery: locationQuery),
              )
            else
              _MapPlaceholder(locationQuery: locationQuery),

            // Location label overlay at bottom
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.65),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_rounded,
                        color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        locationQuery ?? 'Location not available',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'View map',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Centre pin marker
            const Center(
              child: Icon(
                Icons.location_pin,
                color: AppColors.primary,
                size: 36,
                shadows: [
                  Shadow(
                    color: Colors.black26,
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _buildStaticMapUrl(
      String apiKey, String? location, double? lat, double? lng) {
    if (location == null) return '';
    final center = Uri.encodeComponent(location);
    final marker = lat != null && lng != null
        ? 'color:green%7C$lat,$lng'
        : 'color:green%7C${Uri.encodeComponent(location)}';

    return 'https://maps.googleapis.com/maps/api/staticmap'
        '?center=$center'
        '&zoom=15'
        '&size=600x300'
        '&scale=2'
        '&maptype=roadmap'
        '&markers=$marker'
        '&style=feature:poi%7Cvisibility:off'
        '&style=feature:transit%7Cvisibility:off'
        '&key=$apiKey';
  }
}

class _MapPlaceholder extends StatelessWidget {
  const _MapPlaceholder({this.locationQuery});
  final String? locationQuery;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 160,
      color: const Color(0xFFE8F5E9),
      child: CustomPaint(
        painter: _MapGridPainter(),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: AppColors.cardShadow,
                ),
                child: const Icon(Icons.map_outlined,
                    color: AppColors.primary, size: 28),
              ),
              const SizedBox(height: 8),
              if (locationQuery != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    locationQuery!,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFC8E6C9)
      ..strokeWidth = 1;

    // Draw subtle grid lines to simulate a map
    const step = 30.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw a few "road" lines
    final roadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(
        Offset(0, size.height * 0.4),
        Offset(size.width, size.height * 0.4),
        roadPaint);
    canvas.drawLine(
        Offset(size.width * 0.35, 0),
        Offset(size.width * 0.35, size.height),
        roadPaint);
    canvas.drawLine(
        Offset(size.width * 0.7, 0),
        Offset(size.width * 0.7, size.height),
        roadPaint..strokeWidth = 2);
    canvas.drawLine(
        Offset(0, size.height * 0.7),
        Offset(size.width, size.height * 0.7),
        roadPaint..strokeWidth = 2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
