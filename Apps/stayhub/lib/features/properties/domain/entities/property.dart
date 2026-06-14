import 'package:equatable/equatable.dart';
import 'amenity.dart';

class Property extends Equatable {
  const Property({
    required this.id,
    required this.title,
    required this.description,
    required this.propertyType,
    required this.furnishing,
    required this.rent,
    required this.status,
    required this.totalViews,
    required this.totalFavorites,
    required this.totalContacts,
    this.deposit,
    this.bedrooms,
    this.bathrooms,
    this.areaSqft,
    this.availableFrom,
    this.preferredTenant,
    this.locationCity,
    this.locationState,
    this.locationAddress,
    this.locationLocality,
    this.locationPincode,
    this.latitude,
    this.longitude,
    this.ownerName,
    this.ownerId,
    this.images = const [],
    this.amenities = const [],
    this.isFeatured = false,
    this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String propertyType;
  final String furnishing;
  final double rent;
  final String status; // DRAFT | PENDING | ACTIVE | RENTED | EXPIRED | REJECTED

  final double? deposit;
  final int? bedrooms;
  final int? bathrooms;
  final int? areaSqft;
  final String? availableFrom;
  final String? preferredTenant;

  final String? locationCity;
  final String? locationState;
  final String? locationAddress;
  final String? locationLocality;
  final String? locationPincode;
  final double? latitude;
  final double? longitude;

  final String? ownerName;
  final String? ownerId;

  final List<String> images;
  final List<Amenity> amenities;
  final bool isFeatured;

  final int totalViews;
  final int totalFavorites;
  final int totalContacts;
  final String? createdAt;

  bool get isActive => status == 'ACTIVE';

  factory Property.fromJson(Map<String, dynamic> json) {
    // PropertyListSerializer returns location fields flat (city, state, address).
    // PropertySerializer returns them nested under 'location'.
    final loc = json['location'] as Map<String, dynamic>?;
    final ownerRaw = json['owner'];
    final ownerMap = ownerRaw is Map<String, dynamic> ? ownerRaw : null;
    final ownerIdParsed = ownerRaw is String ? ownerRaw : ownerMap?['id'] as String?;

    // Helper: safely parse int from int, double, or string
    int? parseInt(dynamic v) {
      if (v == null) return null;
      if (v is int) return v;
      if (v is double) return v.toInt();
      return int.tryParse(v.toString());
    }

    // Helper: safely parse double from int, double, or string
    double? parseDouble(dynamic v) {
      if (v == null) return null;
      if (v is double) return v;
      if (v is int) return v.toDouble();
      return double.tryParse(v.toString());
    }

    return Property(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      propertyType: json['property_type'] as String? ?? '',
      furnishing: json['furnishing'] as String? ?? '',
      rent: parseDouble(json['rent']) ?? 0.0,
      status: json['status'] as String? ?? 'PENDING',
      deposit: parseDouble(json['deposit']),
      bedrooms: parseInt(json['bedrooms']),
      bathrooms: parseInt(json['bathrooms']),
      areaSqft: parseInt(json['area_sqft']),
      availableFrom: json['available_from'] as String?,
      preferredTenant: json['preferred_tenant'] as String?,
      // Flat fields (PropertyListSerializer) take priority over nested location
      locationCity: (json['city'] as String?)?.isNotEmpty == true
          ? json['city'] as String
          : loc?['city'] as String?,
      locationState: (json['state'] as String?)?.isNotEmpty == true
          ? json['state'] as String
          : loc?['state'] as String?,
      locationAddress: (json['address'] as String?)?.isNotEmpty == true
          ? json['address'] as String
          : loc?['address'] as String?,
      locationLocality: (json['locality'] as String?)?.isNotEmpty == true
          ? json['locality'] as String
          : loc?['locality'] as String?,
      locationPincode: (json['pincode'] as String?)?.isNotEmpty == true
          ? json['pincode'] as String
          : loc?['pincode'] as String?,
      // Parse latitude and longitude from flat or nested location fields
      latitude: parseDouble((json['latitude'] as dynamic?) ?? loc?['latitude']),
      longitude: parseDouble((json['longitude'] as dynamic?) ?? loc?['longitude']),
      ownerName: ownerMap != null
          ? '${ownerMap['first_name'] ?? ''} ${ownerMap['last_name'] ?? ''}'.trim()
          : null,
      ownerId: ownerIdParsed,
      images: (json['images'] as List<dynamic>?)
              ?.map((e) {
                String url = '';
                if (e is String) url = e;
                if (e is Map) url = e['image'] as String? ?? '';
                if (url.startsWith('//')) {
                  url = 'https:$url';
                } else if (url.startsWith('/')) {
                  url = 'http://10.0.2.2:8000$url'; // Fallback for local testing if relative
                }
                return url;
              })
              .where((s) => s.isNotEmpty)
              .toList() ??
          [],
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) {
                if (e is Map) return Amenity.fromJson(e as Map<String, dynamic>);
                return null;
              })
              .whereType<Amenity>()
              .toList() ??
          [],
      isFeatured: json['is_featured'] as bool? ?? false,
      totalViews: parseInt(json['total_views']) ?? 0,
      totalFavorites: parseInt(json['total_favorites']) ?? 0,
      totalContacts: parseInt(json['total_contacts']) ?? 0,
      createdAt: json['created_at'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, title, rent, status, latitude, longitude];
}

class PaginatedProperties {
  const PaginatedProperties({
    required this.results,
    required this.count,
    this.next,
    this.previous,
  });

  final List<Property> results;
  final int count;
  final String? next;
  final String? previous;

  bool get hasMore => next != null;

  factory PaginatedProperties.fromJson(Map<String, dynamic> json) {
    final countRaw = json['count'];
    final count = countRaw is int
        ? countRaw
        : int.tryParse(countRaw?.toString() ?? '0') ?? 0;
    return PaginatedProperties(
      count: count,
      next: json['next'] as String?,
      previous: json['previous'] as String?,
      results: (json['results'] as List<dynamic>)
          .map((e) => Property.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class PropertyFilter {
  const PropertyFilter({
    this.city,
    this.propertyType,
    this.minRent,
    this.maxRent,
    this.furnishing,
    this.bedrooms,
    this.search,
    this.ordering,
    this.limit = 20,
    this.offset = 0,
  });

  final String? city;
  final String? propertyType;
  final double? minRent;
  final double? maxRent;
  final String? furnishing;
  final int? bedrooms;
  final String? search;
  final String? ordering;
  final int limit;
  final int offset;

  Map<String, dynamic> toQueryParams() => {
        if (city != null) 'city': city,
        if (propertyType != null) 'property_type': propertyType,
        if (minRent != null) 'min_rent': minRent.toString(),
        if (maxRent != null) 'max_rent': maxRent.toString(),
        if (furnishing != null) 'furnishing': furnishing,
        if (bedrooms != null) 'bedrooms': bedrooms.toString(),
        if (search != null) 'search': search,
        if (ordering != null) 'ordering': ordering,
        'limit': limit.toString(),
        'offset': offset.toString(),
      };

  /// Sentinel used to distinguish "not provided" from "explicitly null".
  static const _absent = Object();

  PropertyFilter copyWith({
    Object? city = _absent,
    Object? propertyType = _absent,
    Object? minRent = _absent,
    Object? maxRent = _absent,
    Object? furnishing = _absent,
    Object? bedrooms = _absent,
    Object? search = _absent,
    Object? ordering = _absent,
    int? limit,
    int? offset,
  }) =>
      PropertyFilter(
        city: city == _absent ? this.city : city as String?,
        propertyType: propertyType == _absent
            ? this.propertyType
            : propertyType as String?,
        minRent:
            minRent == _absent ? this.minRent : minRent as double?,
        maxRent:
            maxRent == _absent ? this.maxRent : maxRent as double?,
        furnishing: furnishing == _absent
            ? this.furnishing
            : furnishing as String?,
        bedrooms:
            bedrooms == _absent ? this.bedrooms : bedrooms as int?,
        search: search == _absent ? this.search : search as String?,
        ordering:
            ordering == _absent ? this.ordering : ordering as String?,
        limit: limit ?? this.limit,
        offset: offset ?? this.offset,
      );
}
