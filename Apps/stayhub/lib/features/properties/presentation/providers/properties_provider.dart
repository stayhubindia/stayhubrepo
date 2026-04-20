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
}

final propertyFilterProvider =
    NotifierProvider<_FilterNotifier, PropertyFilter>(_FilterNotifier.new);

// ── Paginated property list ───────────────────────────────────
final propertiesProvider =
    FutureProvider.autoDispose<PaginatedProperties>((ref) async {
  final filter = ref.watch(propertyFilterProvider);
  final api = ref.read(propertiesApiClientProvider);
  return api.getProperties(filter);
});

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
