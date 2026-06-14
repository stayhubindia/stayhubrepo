import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../properties/domain/entities/property.dart';

class Favorite {
  const Favorite({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyCity,
    required this.propertyRent,
    this.property,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String? propertyCity;
  final double propertyRent;

  /// Full property object — only present when the server returns nested data.
  final Property? property;

  /// Build a minimal Property from the flat favorite fields so existing
  /// widgets that expect a [Property] still work.
  Property get asProperty =>
      property ??
      Property(
        id: propertyId,
        title: propertyTitle,
        description: '',
        propertyType: '',
        furnishing: '',
        rent: propertyRent,
        status: 'ACTIVE',
        totalViews: 0,
        totalFavorites: 0,
        totalContacts: 0,
        locationCity: propertyCity,
      );

  factory Favorite.fromJson(Map<String, dynamic> json) {
    // ── Flat format (server returns property_id, property_title, etc.) ──
    if (json.containsKey('property_id') && json['property'] == null) {
      return Favorite(
        id: json['id'] as String,
        propertyId: json['property_id'] as String,
        propertyTitle: json['property_title'] as String? ?? '',
        propertyCity: json['property_city'] as String?,
        propertyRent: _toDouble(json['property_rent']),
      );
    }

    // ── Nested format (property is a full object) ─────────────────────
    final propJson = json['property'] as Map<String, dynamic>?;
    final prop = propJson != null ? Property.fromJson(propJson) : null;
    return Favorite(
      id: json['id'] as String,
      propertyId: prop?.id ?? json['property_id'] as String? ?? '',
      propertyTitle: prop?.title ?? '',
      propertyCity: prop?.locationCity,
      propertyRent: prop?.rent ?? 0,
      property: prop,
    );
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }
}

class FavoritesApiClient {
  const FavoritesApiClient(this._dio);
  final Dio _dio;

  Future<List<Favorite>> getFavorites() async {
    final res = await _dio.get(ApiConstants.favorites);
    final data = res.data;
    final list = data is List
        ? data
        : (data as Map<String, dynamic>)['results'] as List<dynamic>? ?? [];
    return list
        .map((e) => Favorite.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Favorite> addFavorite(String propertyId) async {
    final res = await _dio.post(
      ApiConstants.favorites,
      data: {'property_id': propertyId},
    );
    return Favorite.fromJson(res.data as Map<String, dynamic>);
  }

  /// Remove by PROPERTY UUID — server route: DELETE /api/v1/favorites/{property_id}/
  Future<void> removeFavorite(String propertyId) async {
    await _dio.delete(ApiConstants.favoriteDelete(propertyId));
  }
}
