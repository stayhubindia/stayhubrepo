import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../../properties/data/properties_api_client.dart';
import '../../../properties/domain/entities/property.dart';
import '../../data/analytics_api_client.dart';
import '../../../contacts/data/contacts_api_client.dart';

// ── Analytics API client ──────────────────────────────────────
final analyticsApiClientProvider = Provider(
  (ref) => AnalyticsApiClient(ref.read(dioProvider)),
);

// ── My listings ───────────────────────────────────────────────
final myListingsProvider =
    FutureProvider.autoDispose<PaginatedProperties>((ref) async {
  final api = PropertiesApiClient(ref.read(dioProvider));
  return api.getMyProperties();
});

// ── Dashboard stats ───────────────────────────────────────────
final dashboardStatsProvider =
    FutureProvider.autoDispose<DashboardStats>((ref) async {
  final raw =
      await ref.read(analyticsApiClientProvider).getMyPropertiesRaw();
  return DashboardStats.fromProperties(raw);
});

// ── Tour Requests ─────────────────────────────────────────────
final tourRequestsProvider =
    FutureProvider.autoDispose<List<TourRequest>>((ref) async {
  final api = ContactsApiClient(ref.read(dioProvider));
  return api.getTourRequests();
});
