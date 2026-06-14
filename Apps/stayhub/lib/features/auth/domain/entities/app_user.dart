import 'package:equatable/equatable.dart';

class AppUser extends Equatable {
  const AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.profilePicture,
    this.locationCity,
    this.dateJoined,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;

  /// OWNER | TENANT | ADMIN
  final String role;
  final String? phone;
  final String? profilePicture;
  final String? locationCity;
  final DateTime? dateJoined;

  String get fullName => '$firstName $lastName'.trim();
  bool get isOwner => role == 'OWNER';
  bool get isTenant => role == 'TENANT';

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String? ?? '',
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
        role: json['role'] as String? ?? 'TENANT',
        phone: json['phone'] as String?,
        profilePicture: json['profile_picture'] as String?,
        locationCity: (json['location'] as Map<String, dynamic>?)?['city']
            as String?,
        dateJoined: json['date_joined'] != null
            ? DateTime.tryParse(json['date_joined'] as String)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
        'phone': phone,
        'profile_picture': profilePicture,
        if (dateJoined != null) 'date_joined': dateJoined?.toIso8601String(),
      };

  AppUser copyWith({
    String? firstName,
    String? lastName,
    String? phone,
    String? profilePicture,
    String? locationCity,
  }) =>
      AppUser(
        id: id,
        email: email,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        role: role,
        phone: phone ?? this.phone,
        profilePicture: profilePicture ?? this.profilePicture,
        locationCity: locationCity ?? this.locationCity,
        dateJoined: dateJoined ?? this.dateJoined,
      );

  @override
  List<Object?> get props =>
      [id, email, firstName, lastName, role, phone, profilePicture, dateJoined];
}
