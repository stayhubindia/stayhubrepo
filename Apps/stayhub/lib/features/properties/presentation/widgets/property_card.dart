import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/property.dart';

class PropertyCard extends StatelessWidget {
  const PropertyCard({super.key, required this.property, this.onFavorite});

  final Property property;
  final VoidCallback? onFavorite;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/properties/${property.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image ────────────────────────────────────────
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: property.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: property.images.first,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: AppColors.surfaceVariant),
                            errorWidget: (context, url, error) {
                              debugPrint('Error loading image $url: $error');
                              return _PlaceholderImage();
                            },
                          )
                        : _PlaceholderImage(),
                  ),
                ),
                // Gradient overlay (bottom)
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16)),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.35),
                          ],
                          stops: const [0.55, 1.0],
                        ),
                      ),
                    ),
                  ),
                ),
                // Status badge
                Positioned(
                  top: 10,
                  left: 10,
                  child: _StatusBadge(status: property.status),
                ),
                // Favorite + price overlay
                Positioned(
                  bottom: 10,
                  left: 12,
                  right: 10,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${_formatRent(property.rent)}/mo',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                          shadows: [
                            Shadow(
                              color: Colors.black38,
                              blurRadius: 4,
                            )
                          ],
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: onFavorite,
                        child: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: AppColors.cardShadow,
                          ),
                          child: Icon(
                            onFavorite != null
                                ? Icons.favorite_outline
                                : Icons.favorite,
                            size: 16,
                            color: onFavorite != null
                                ? AppColors.textSecondary
                                : AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // ── Details ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          property.propertyType,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (property.bedrooms != null)
                        _IconLabel(
                            icon: Icons.king_bed_outlined,
                            label: '${property.bedrooms}'),
                      if (property.bathrooms != null) ...[
                        const SizedBox(width: 8),
                        _IconLabel(
                            icon: Icons.bathtub_outlined,
                            label: '${property.bathrooms}'),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    property.title,
                    style: AppTextStyles.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (property.locationCity != null) ...[
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 13, color: AppColors.textHint),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            property.locationCity!,
                            style: AppTextStyles.caption,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatRent(double rent) {
    if (rent >= 100000) return '${(rent / 100000).toStringAsFixed(1)}L';
    if (rent >= 1000) return '${(rent / 1000).toStringAsFixed(0)}K';
    return rent.toStringAsFixed(0);
  }
}

class _PlaceholderImage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      width: double.infinity,
      color: AppColors.surfaceVariant,
      child: const Icon(
        Icons.home_outlined,
        size: 48,
        color: AppColors.textHint,
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (status) {
      case 'ACTIVE':
        bg = AppColors.statusActiveLight;
        fg = AppColors.statusActive;
        break;
      case 'PENDING':
        bg = AppColors.statusPendingLight;
        fg = AppColors.statusPending;
        break;
      case 'RENTED':
        bg = AppColors.statusRentedLight;
        fg = AppColors.statusRented;
        break;
      case 'REJECTED':
        bg = AppColors.statusRejectedLight;
        fg = AppColors.statusRejected;
        break;
      default:
        bg = AppColors.statusDraftLight;
        fg = AppColors.statusDraft;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

class _IconLabel extends StatelessWidget {
  const _IconLabel({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textHint),
        const SizedBox(width: 3),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}
