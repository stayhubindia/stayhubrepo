import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../data/favorites_api_client.dart';

// ── API client ────────────────────────────────────────────────
final favoritesApiClientProvider = Provider(
  (ref) => FavoritesApiClient(ref.read(dioProvider)),
);

// ── Favorites list ────────────────────────────────────────────
final favoritesProvider =
    FutureProvider.autoDispose<List<Favorite>>((ref) async {
  return ref.read(favoritesApiClientProvider).getFavorites();
});

// ── Favorite IDs set (for quick lookup on property cards) ─────
final favoritePropertyIdsProvider =
    FutureProvider.autoDispose<Set<String>>((ref) async {
  final favs = await ref.watch(favoritesProvider.future);
  return favs.map((f) => f.property.id).toSet();
});
