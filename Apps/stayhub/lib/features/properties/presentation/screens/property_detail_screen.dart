import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../providers/properties_provider.dart';

class PropertyDetailScreen extends ConsumerWidget {
  const PropertyDetailScreen({super.key, required this.propertyId});

  final String propertyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyAsync = ref.watch(propertyDetailProvider(propertyId));

    return Scaffold(
      body: propertyAsync.when(
        loading: () => const Scaffold(
          body: Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: Center(child: Text(e.toString())),
        ),
        data: (property) {
          return CustomScrollView(
            slivers: [
              // Image app bar
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: property.images.isNotEmpty
                      ? Image.network(
                          property.images.first,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: AppColors.surfaceVariant,
                            child: const Icon(Icons.home_outlined,
                                size: 80, color: AppColors.textHint),
                          ),
                        )
                      : Container(
                          color: AppColors.surfaceVariant,
                          child: const Icon(Icons.home_outlined,
                              size: 80, color: AppColors.textHint),
                        ),
                ),
              ),

              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Type + Status row
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(property.propertyType,
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(property.furnishing,
                              style: AppTextStyles.caption),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Title
                    Text(property.title, style: AppTextStyles.heading),
                    const SizedBox(height: 6),

                    // Location
                    if (property.locationCity != null)
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined,
                              size: 16, color: AppColors.textHint),
                          const SizedBox(width: 4),
                          Text(
                            [property.locationCity, property.locationState]
                                .whereType<String>()
                                .join(', '),
                            style: AppTextStyles.bodySecondary,
                          ),
                        ],
                      ),
                    const SizedBox(height: 16),

                    // Price
                    Row(
                      children: [
                        Text(
                          '₹${property.rent.toStringAsFixed(0)}',
                          style: AppTextStyles.price.copyWith(fontSize: 24),
                        ),
                        Text('/month',
                            style: AppTextStyles.bodySecondary),
                        if (property.deposit != null) ...[
                          const SizedBox(width: 16),
                          Text(
                            'Deposit: ₹${property.deposit!.toStringAsFixed(0)}',
                            style: AppTextStyles.bodySecondary,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Stats row
                    Row(
                      children: [
                        if (property.bedrooms != null)
                          _Spec(
                              icon: Icons.king_bed_outlined,
                              label: '${property.bedrooms} Beds'),
                        if (property.bathrooms != null)
                          _Spec(
                              icon: Icons.bathtub_outlined,
                              label: '${property.bathrooms} Baths'),
                        if (property.areaSqft != null)
                          _Spec(
                              icon: Icons.square_foot_outlined,
                              label: '${property.areaSqft} sqft'),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 16),

                    // Description
                    Text('About this property', style: AppTextStyles.subtitle),
                    const SizedBox(height: 8),
                    Text(property.description, style: AppTextStyles.body),
                    const SizedBox(height: 100), // space for bottom bar
                  ]),
                ),
              ),
            ],
          );
        },
      ),
      // Bottom CTA
      bottomNavigationBar: propertyAsync.hasValue
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.favorite_outline),
                        label: const Text('Save'),
                        onPressed: () {},
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.chat_bubble_outline),
                        label: const Text('Chat with Owner'),
                        onPressed: () {
                          // Will start conversation via API then go to chat screen
                        },
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}

class _Spec extends StatelessWidget {
  const _Spec({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 20),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Text(label, style: AppTextStyles.body),
        ],
      ),
    );
  }
}
