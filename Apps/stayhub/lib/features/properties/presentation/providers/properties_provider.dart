import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../domain/entities/property.dart';
import '../../data/properties_api_client.dart';

// ── API client provider ───────────────────────────────────────
final propertiesApiClientProvider = Provider(
  (ref) => PropertiesApiClient(ref.read(dioProvider)),
);

// ── Filter state ──────────────────────────────────────────────
class _FilterNotifier extends Notifier<PropertyFilter> {
  @override
  PropertyFilter build() => const PropertyFilter();

  void setFilter(PropertyFilter filter) => state = filter;

  void reset() => state = const PropertyFilter();
}

final propertyFilterProvider =
    NotifierProvider<_FilterNotifier, PropertyFilter>(_FilterNotifier.new);

// ── Paginated property list ───────────────────────────────────
//
// Holds accumulated results across pages. Watching the filter resets
// to page 1; incrementing offset appends the next page.

class PropertiesNotifier
    extends Notifier<AsyncValue<PaginatedProperties>> {
  @override
  AsyncValue<PaginatedProperties> build() {
    // Re-run whenever the filter changes.
    final filter = ref.watch(propertyFilterProvider);
    _load(filter);
    return const AsyncValue.loading();
  }

  Future<void> _load(PropertyFilter filter) async {
    final api = ref.read(propertiesApiClientProvider);

    if (filter.offset > 0) {
      // Append mode — keep existing results while loading.
      final existing = state.value;
      try {
        final next = await api.getProperties(filter);
        if (existing != null) {
          state = AsyncValue.data(PaginatedProperties(
            results: [...existing.results, ...next.results],
            count: next.count,
            next: next.next,
            previous: next.previous,
          ));
        } else {
          state = AsyncValue.data(next);
        }
      } catch (e, st) {
        state = AsyncValue.error(e, st);
      }
      return;
    }

    // Fresh load.
    state = const AsyncValue.loading();
    try {
      state = AsyncValue.data(await api.getProperties(filter));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void retry() {
    final filter = ref.read(propertyFilterProvider);
    _load(filter);
  }
}

final propertiesProvider =
    NotifierProvider<PropertiesNotifier, AsyncValue<PaginatedProperties>>(
  PropertiesNotifier.new,
);

// ── Single property detail ────────────────────────────────────
final propertyDetailProvider =
    FutureProvider.autoDispose.family<Property, String>((ref, id) async {
  final api = ref.read(propertiesApiClientProvider);
  return api.getProperty(id);
});

// ── Owner's own listings ──────────────────────────────────────
final myPropertiesProvider =
    FutureProvider.autoDispose<PaginatedProperties>((ref) async {
  final api = ref.read(propertiesApiClientProvider);
  return api.getMyProperties();
});
