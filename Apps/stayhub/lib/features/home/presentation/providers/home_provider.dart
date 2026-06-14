import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../dashboard/data/analytics_api_client.dart';
import '../../../properties/data/properties_api_client.dart';
import '../../../properties/domain/entities/property.dart';
import '../../../../core/di/providers.dart';

// ── Rental Properties (tenant home) ──────────────────────────
final rentalPropertiesProvider =
    FutureProvider.autoDispose<List<Property>>((ref) async {
  final api = PropertiesApiClient(ref.read(dioProvider));
  final result = await api.getProperties(
    const PropertyFilter(limit: 6, offset: 0),
  );
  return result.results;
});

// ── Rental Rooms / PG (tenant home) ──────────────────────────
final rentalRoomsProvider =
    FutureProvider.autoDispose<List<Property>>((ref) async {
  final api = PropertiesApiClient(ref.read(dioProvider));
  final result = await api.getProperties(
    const PropertyFilter(propertyType: 'PG', limit: 6, offset: 0),
  );
  return result.results;
});

// ── Owner: my listings (owner home) ──────────────────────────
final myListingsHomeProvider =
    FutureProvider.autoDispose<List<Property>>((ref) async {
  final api = PropertiesApiClient(ref.read(dioProvider));
  final result = await api.getMyProperties();
  return result.results;
});

// ── Owner: dashboard stats (owner home) ──────────────────────
final ownerStatsProvider =
    FutureProvider.autoDispose<DashboardStats>((ref) async {
  final api = AnalyticsApiClient(ref.read(dioProvider));
  final raw = await api.getMyPropertiesRaw();
  return DashboardStats.fromProperties(raw);
});
