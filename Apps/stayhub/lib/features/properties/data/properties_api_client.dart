import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../domain/entities/property.dart';
import '../domain/entities/amenity.dart';

class PropertiesApiClient {
  const PropertiesApiClient(this._dio);
  final Dio _dio;

  Future<PaginatedProperties> getProperties(PropertyFilter filter) async {
    final res = await _dio.get(
      ApiConstants.properties,
      queryParameters: filter.toQueryParams(),
    );
    return _parsePaginated(res.data);
  }

  Future<List<Amenity>> getAmenities() async {
    final res = await _dio.get(ApiConstants.amenities);
    return (res.data as List).map((e) => Amenity.fromJson(e)).toList();
  }

  Future<Property> getProperty(String id) async {
    final res = await _dio.get(ApiConstants.propertyDetail(id));
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Property> createProperty(Map<String, dynamic> data) async {
    final res = await _dio.post(ApiConstants.properties, data: data);
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Property> updateProperty(String id, Map<String, dynamic> data) async {
    final res =
        await _dio.patch(ApiConstants.propertyDetail(id), data: data);
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> deleteProperty(String id) async {
    await _dio.delete(ApiConstants.propertyDetail(id));
  }

  Future<Property> submitProperty(String id) async {
    final res = await _dio.post(ApiConstants.propertySubmit(id));
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  Future<PaginatedProperties> getMyProperties() async {
    final res = await _dio.get(
      ApiConstants.properties,
      queryParameters: {'mine': 'true', 'limit': '50'},
    );
    return _parsePaginated(res.data);
  }

  Future<void> uploadPropertyImage(String propertyId, String filePath, {bool isPrimary = false}) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(filePath),
      'is_primary': isPrimary,
    });
    await _dio.post(
      ApiConstants.propertyImages(propertyId),
      data: formData,
    );
  }

  /// Handles both paginated `{ count, results: [...] }` and plain `[...]`
  static PaginatedProperties _parsePaginated(dynamic data) {
    if (data is List) {
      final results = data
          .map((e) => Property.fromJson(e as Map<String, dynamic>))
          .toList();
      return PaginatedProperties(
        results: results,
        count: results.length,
      );
    }
    final map = data as Map<String, dynamic>;
    return PaginatedProperties.fromJson(map);
  }
}
