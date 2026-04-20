/// Central API endpoint strings.
class ApiConstants {
  ApiConstants._();

  // ── Auth ─────────────────────────────────────────────────
  static const String otpRequest   = '/api/v1/auth/email-otp/request/';
  static const String otpVerify    = '/api/v1/auth/email-otp/verify/';
  static const String firebaseLogin = '/api/v1/auth/firebase/login/';
  static const String firebaseLink  = '/api/v1/auth/firebase/link/';
  static const String tokenRefresh = '/api/v1/auth/token/refresh/';
  static const String me           = '/api/v1/users/me/';

  // ── Properties ───────────────────────────────────────────
  static const String properties = '/api/v1/properties/';
  static String propertyDetail(String id) => '/api/v1/properties/$id/';
  static String propertySubmit(String id) => '/api/v1/properties/$id/submit/';

  // ── Favorites ────────────────────────────────────────────
  static const String favorites = '/api/v1/favorites/';
  static String favoriteDetail(String id) => '/api/v1/favorites/$id/';

  // ── Contacts / Leads ─────────────────────────────────────
  static const String contacts = '/api/v1/contacts/';

  // ── Conversations / Chat ─────────────────────────────────
  static const String conversations = '/api/v1/conversations/';
  static String messages(String id) =>
      '/api/v1/conversations/$id/messages/';
  static String markRead(String id) =>
      '/api/v1/conversations/$id/mark-read/';

  // ── Notifications ────────────────────────────────────────
  static const String notifications = '/api/v1/notifications/';
  static String notificationDetail(String id) =>
      '/api/v1/notifications/$id/';
  static const String notificationsMarkAllRead =
      '/api/v1/notifications/mark-all-read/';

  // ── Analytics ────────────────────────────────────────────
  static const String analyticsProperties = '/api/v1/analytics/properties/';
  static String analyticsProperty(String id) =>
      '/api/v1/analytics/properties/$id/';

  // ── Health ───────────────────────────────────────────────
  static const String health = '/api/v1/health/';
}
