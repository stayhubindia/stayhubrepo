import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../properties/presentation/widgets/property_card.dart';
import '../providers/favorites_provider.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favAsync = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Saved Properties')),
      body: favAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 48, color: AppColors.textHint),
              const SizedBox(height: 12),
              Text(e.toString(), style: AppTextStyles.bodySecondary),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => ref.invalidate(favoritesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (favorites) {
          if (favorites.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.favorite_outline,
                      size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  Text('No saved properties', style: AppTextStyles.subtitle),
                  const SizedBox(height: 8),
                  Text(
                    'Tap the heart icon on any property to save it here.',
                    style: AppTextStyles.bodySecondary,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: favorites.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (_, i) {
              final fav = favorites[i];
              return PropertyCard(
                property: fav.property,
                onFavorite: () async {
                  await ref
                      .read(favoritesApiClientProvider)
                      .removeFavorite(fav.id);
                  ref.invalidate(favoritesProvider);
                },
              );
            },
          );
        },
      ),
    );
  }
}
