class AppConstants {
  AppConstants._();

  static const String appName = 'StayHub';
  static const String tokenBoxKey = 'stayhub_tokens';

  // Secure storage keys
  static const String accessTokenKey = 'stayhub_access_token';
  static const String refreshTokenKey = 'stayhub_refresh_token';

  // SharedPreferences keys
  static const String onboardingDoneKey = 'onboarding_done';

  // Pagination
  static const int pageSize = 20;

  // WebSocket reconnect
  static const int wsMaxRetries = 5;
  static const Duration wsReconnectDelay = Duration(seconds: 3);

  // Typing indicator timeout
  static const Duration typingTimeout = Duration(seconds: 3);

  // Property types
  static const List<String> propertyTypes = [
    'PG',
    '1RK',
    '1BHK',
    '2BHK',
    '3BHK',
    'HOUSE',
    'COMMERCIAL',
  ];

  // Furnishing types
  static const List<String> furnishingTypes = [
    'FURNISHED',
    'SEMI',
    'UNFURNISHED',
  ];

  // Preferred tenant
  static const List<String> preferredTenantOptions = [
    'ANY',
    'MALE',
    'FEMALE',
  ];

  // Popular cities (mirrors the webapp)
  static const List<String> popularCities = [
    'Mumbai',
    'Pune',
    'Bangalore',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Ahmedabad',
    'Kolkata',
    'Jaipur',
    'Surat',
  ];
}
