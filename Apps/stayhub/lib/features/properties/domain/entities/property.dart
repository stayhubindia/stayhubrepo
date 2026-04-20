import 'package:equatable/equatable.dart';

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

  final String? ownerName;
  final String? ownerId;

  final List<String> images;
  final List<String> amenities;
  final bool isFeatured;

  final int totalViews;
  final int totalFavorites;
  final int totalContacts;
  final String? createdAt;

  bool get isActive => status == 'ACTIVE';

  factory Property.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>?;
    final owner = json['owner'] as Map<String, dynamic>?;

    return Property(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      propertyType: json['property_type'] as String? ?? '',
      furnishing: json['furnishing'] as String? ?? '',
      rent: double.tryParse(json['rent']?.toString() ?? '0') ?? 0,
      status: json['status'] as String? ?? 'PENDING',
      deposit: double.tryParse(json['deposit']?.toString() ?? ''),
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      areaSqft: json['area_sqft'] as int?,
      availableFrom: json['available_from'] as String?,
      preferredTenant: json['preferred_tenant'] as String?,
      locationCity: loc?['city'] as String?,
      locationState: loc?['state'] as String?,
      locationAddress: loc?['address'] as String?,
      ownerName: owner != null
          ? '${owner['first_name'] ?? ''} ${owner['last_name'] ?? ''}'.trim()
          : null,
      ownerId: owner?['id'] as String?,
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      isFeatured: json['is_featured'] as bool? ?? false,
      totalViews: json['total_views'] as int? ?? 0,
      totalFavorites: json['total_favorites'] as int? ?? 0,
      totalContacts: json['total_contacts'] as int? ?? 0,
      createdAt: json['created_at'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, title, rent, status];
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

  factory PaginatedProperties.fromJson(Map<String, dynamic> json) =>
      PaginatedProperties(
        count: json['count'] as int? ?? 0,
        next: json['next'] as String?,
        previous: json['previous'] as String?,
        results: (json['results'] as List<dynamic>)
            .map((e) => Property.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
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

  PropertyFilter copyWith({
    String? city,
    String? propertyType,
    double? minRent,
    double? maxRent,
    String? furnishing,
    int? bedrooms,
    String? search,
    String? ordering,
    int? limit,
    int? offset,
  }) =>
      PropertyFilter(
        city: city ?? this.city,
        propertyType: propertyType ?? this.propertyType,
        minRent: minRent ?? this.minRent,
        maxRent: maxRent ?? this.maxRent,
        furnishing: furnishing ?? this.furnishing,
        bedrooms: bedrooms ?? this.bedrooms,
        search: search ?? this.search,
        ordering: ordering ?? this.ordering,
        limit: limit ?? this.limit,
        offset: offset ?? this.offset,
      );
}
