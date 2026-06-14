import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is double) return v.toInt();
  return int.tryParse(v.toString()) ?? 0;
}

class DashboardStats {
  const DashboardStats({
    required this.totalListings,
    required this.activeListings,
    required this.totalViews,
    required this.totalContacts,
    required this.totalFavorites,
  });

  final int totalListings;
  final int activeListings;
  final int totalViews;
  final int totalContacts;
  final int totalFavorites;

  factory DashboardStats.fromProperties(List<Map<String, dynamic>> props) {
    int active = 0;
    int views = 0;
    int contacts = 0;
    int favorites = 0;

    for (final p in props) {
      if (p['status'] == 'ACTIVE') active++;
      views += _toInt(p['total_views']);
      contacts += _toInt(p['total_contacts']);
      favorites += _toInt(p['total_favorites']);
    }

    return DashboardStats(
      totalListings: props.length,
      activeListings: active,
      totalViews: views,
      totalContacts: contacts,
      totalFavorites: favorites,
    );
  }
}

class OwnerDashboardSnapshot {
  const OwnerDashboardSnapshot({
    required this.date,
    required this.totalListings,
    required this.activeListings,
    required this.totalViews,
    required this.totalContacts,
    required this.totalFavorites,
  });

  final String date;
  final int totalListings;
  final int activeListings;
  final int totalViews;
  final int totalContacts;
  final int totalFavorites;

  factory OwnerDashboardSnapshot.fromJson(Map<String, dynamic> json) =>
      OwnerDashboardSnapshot(
        date: json['date'] as String? ?? '',
        totalListings: _toInt(json['total_listings']),
        activeListings: _toInt(json['active_listings']),
        totalViews: _toInt(json['total_views']),
        totalContacts: _toInt(json['total_contacts']),
        totalFavorites: _toInt(json['total_favorites']),
      );
}

class AnalyticsApiClient {
  const AnalyticsApiClient(this._dio);
  final Dio _dio;

  /// GET /api/v1/analytics/dashboard/
  /// Optional query params: start=YYYY-MM-DD, end=YYYY-MM-DD
  Future<List<OwnerDashboardSnapshot>> getDashboard({
    DateTime? start,
    DateTime? end,
  }) async {
    final params = <String, String>{};
    if (start != null) params['start'] = _fmt(start);
    if (end != null) params['end'] = _fmt(end);

    final res = await _dio.get(
      ApiConstants.analyticsDashboard,
      queryParameters: params.isEmpty ? null : params,
    );
    final list = (res.data as List<dynamic>);
    return list
        .map((e) =>
            OwnerDashboardSnapshot.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /api/v1/properties/?mine=true
  /// Used to build DashboardStats from the owner's own listings.
  Future<List<Map<String, dynamic>>> getMyPropertiesRaw() async {
    final res = await _dio.get(
      ApiConstants.properties,
      queryParameters: {'mine': 'true', 'limit': '100'},
    );
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  static String _fmt(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
