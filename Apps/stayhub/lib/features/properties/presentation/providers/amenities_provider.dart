import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../data/properties_api_client.dart';
import '../../domain/entities/amenity.dart';

final amenitiesProvider = FutureProvider.autoDispose<List<Amenity>>((ref) async {
  final dio = ref.watch(dioProvider);
  final api = PropertiesApiClient(dio);
  return api.getAmenities();
});
