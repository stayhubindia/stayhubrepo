import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';

/// Contact types supported by the server.
enum ContactType { call, whatsapp, email, visit }

extension ContactTypeExt on ContactType {
  String get value {
    switch (this) {
      case ContactType.call:
        return 'CALL';
      case ContactType.whatsapp:
        return 'WHATSAPP';
      case ContactType.email:
        return 'EMAIL';
      case ContactType.visit:
        return 'VISIT';
    }
  }
}

class ContactLog {
  const ContactLog({
    required this.id,
    required this.propertyId,
    required this.contactType,
    required this.createdAt,
    this.message,
  });

  final String id;
  final String propertyId;
  final String contactType;
  final DateTime createdAt;
  final String? message;

  factory ContactLog.fromJson(Map<String, dynamic> json) => ContactLog(
        id: json['id'] as String,
        propertyId: (json['property'] is Map)
            ? json['property']['id'] as String
            : json['property'] as String,
        contactType: json['contact_type'] as String? ?? '',
        createdAt: DateTime.parse(json['created_at'] as String),
        message: json['message'] as String?,
      );
}

class TourRequest {
  const TourRequest({
    required this.id,
    required this.propertyId,
    required this.tourDate,
    required this.tourTime,
    required this.status,
    this.message,
  });

  final String id;
  final String propertyId;
  final String tourDate;
  final String tourTime;
  final String status;
  final String? message;

  factory TourRequest.fromJson(Map<String, dynamic> json) => TourRequest(
        id: json['id'] as String,
        propertyId: (json['property'] is Map)
            ? json['property']['id'] as String
            : json['property'] as String,
        tourDate: json['tour_date'] as String,
        tourTime: json['tour_time'] as String,
        status: json['status'] as String,
        message: json['message'] as String?,
      );
}

class ContactsApiClient {
  const ContactsApiClient(this._dio);
  final Dio _dio;

  /// POST /api/v1/contacts/
  /// Records a contact/lead event (call, WhatsApp, email, visit).
  Future<ContactLog> createContact({
    required String propertyId,
    required ContactType contactType,
    String? message,
  }) async {
    final res = await _dio.post(
      ApiConstants.contacts,
      data: {
        'property_id': propertyId,
        'contact_type': contactType.value,
        if (message != null) 'message': message,
      },
    );
    return ContactLog.fromJson(res.data as Map<String, dynamic>);
  }

  /// GET /api/v1/contacts/leads/
  /// Owner-only: list all leads for the owner's properties.
  Future<List<ContactLog>> getLeads() async {
    final res = await _dio.get(ApiConstants.contactLeads);
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
    return list
        .map((e) => ContactLog.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/v1/contacts/tours/
  /// Requests a tour for a property.
  Future<TourRequest> requestTour({
    required String propertyId,
    required String tourDate,
    required String tourTime,
    String? message,
  }) async {
    final res = await _dio.post(
      ApiConstants.tours,
      data: {
        'property_id': propertyId,
        'tour_date': tourDate,
        'tour_time': tourTime,
        if (message != null && message.isNotEmpty) 'message': message,
      },
    );
    return TourRequest.fromJson(res.data as Map<String, dynamic>);
  }

  /// GET /api/v1/contacts/tours/
  /// Lists all tour requests for the user.
  Future<List<TourRequest>> getTourRequests() async {
    final res = await _dio.get(ApiConstants.tours);
    final list = (res.data['results'] ?? res.data) as List<dynamic>;
    return list
        .map((e) => TourRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// PATCH /api/v1/contacts/tours/{id}/
  /// Updates the status of a tour request.
  Future<TourRequest> updateTourStatus(String tourId, String status) async {
    final res = await _dio.patch(
      '${ApiConstants.tours}$tourId/',
      data: {'status': status},
    );
    return TourRequest.fromJson(res.data as Map<String, dynamic>);
  }
}
