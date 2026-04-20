import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../domain/entities/property.dart';

class PropertiesApiClient {
  const PropertiesApiClient(this._dio);
  final Dio _dio;

  Future<PaginatedProperties> getProperties(PropertyFilter filter) async {
    final res = await _dio.get(
      ApiConstants.properties,
      queryParameters: filter.toQueryParams(),
    );
    return PaginatedProperties.fromJson(res.data as Map<String, dynamic>);
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
    final res = await _dio.patch(ApiConstants.propertyDetail(id), data: data);
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> deleteProperty(String id) async {
    await _dio.delete(ApiConstants.propertyDetail(id));
  }

  Future<Property> submitProperty(String id) async {
    final res = await _dio.post(ApiConstants.propertySubmit(id));
    return Property.fromJson(res.data as Map<String, dynamic>);
  }

  /// Owner's own listings
  Future<PaginatedProperties> getMyProperties() async {
    final res = await _dio.get(
      ApiConstants.properties,
      queryParameters: {'mine': 'true', 'limit': '50'},
    );
    return PaginatedProperties.fromJson(res.data as Map<String, dynamic>);
  }
}
