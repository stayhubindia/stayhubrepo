import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../properties/domain/entities/property.dart';

class Favorite {
  const Favorite({required this.id, required this.property});
  final String id;
  final Property property;

  factory Favorite.fromJson(Map<String, dynamic> json) => Favorite(
        id: json['id'] as String,
        property: Property.fromJson(
            json['property'] as Map<String, dynamic>),
      );
}

class FavoritesApiClient {
  const FavoritesApiClient(this._dio);
  final Dio _dio;

  Future<List<Favorite>> getFavorites() async {
    final res = await _dio.get(ApiConstants.favorites);
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
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

  Future<void> removeFavorite(String favoriteId) async {
    await _dio.delete(ApiConstants.favoriteDetail(favoriteId));
  }
}
