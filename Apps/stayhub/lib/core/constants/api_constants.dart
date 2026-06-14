/// Central API endpoint strings — matched to the StayHub Django backend.
class ApiConstants {
  ApiConstants._();

  // ── Auth ─────────────────────────────────────────────────
  static const String otpRequest    = '/api/v1/auth/email-otp/request/';
  static const String otpVerify     = '/api/v1/auth/email-otp/verify/';
  static const String firebaseLogin = '/api/v1/auth/firebase/login/';
  static const String firebaseLink  = '/api/v1/auth/firebase/link/';
  static const String tokenRefresh  = '/api/v1/auth/token/refresh/';

  // ── Users ─────────────────────────────────────────────────
  static const String me = '/api/v1/users/me/';

  // ── Properties ───────────────────────────────────────────
  // Router-generated: GET/POST /properties/
  static const String properties = '/api/v1/properties/';
  static String propertyDetail(String id)   => '/api/v1/properties/$id/';
  static String propertySubmit(String id)   => '/api/v1/properties/$id/submit/';
  static String propertyMarkRented(String id) => '/api/v1/properties/$id/mark-rented/';
  static const String amenities = '/api/v1/amenities/';
  static String propertyImages(String id)   => '/api/v1/properties/$id/images/';
  static String propertyImageSetPrimary(String propertyId, String imageId) =>
      '/api/v1/properties/$propertyId/images/$imageId/set-primary/';
  static String propertyImageDelete(String propertyId, String imageId) =>
      '/api/v1/properties/$propertyId/images/$imageId/';
  static const String propertiesTrending   = '/api/v1/properties/trending/';
  static const String propertiesPublic     = '/api/v1/properties/public/';
  static const String propertiesSearch     = '/api/v1/properties/search/';

  // ── Favorites ────────────────────────────────────────────
  // POST  /favorites/           → add favorite  (body: { property_id })
  // DELETE /favorites/{propertyId}/  → remove by PROPERTY UUID (not favorite id)
  static const String favorites = '/api/v1/favorites/';
  static String favoriteDelete(String propertyId) =>
      '/api/v1/favorites/$propertyId/';

  // ── Contacts / Leads ─────────────────────────────────────
  static const String contacts     = '/api/v1/contacts/';
  static const String contactLeads = '/api/v1/contacts/leads/';
  static const String tours        = '/api/v1/contacts/tours/';

  // ── Communication / Chat ─────────────────────────────────
  static const String conversations = '/api/v1/communication/conversations/';
  static String messages(String conversationId) =>
      '/api/v1/communication/conversations/$conversationId/messages/';
  static String markRead(String conversationId) =>
      '/api/v1/communication/conversations/$conversationId/read/';
  static String archiveConversation(String conversationId) =>
      '/api/v1/communication/conversations/$conversationId/archive/';

  // ── Notifications ────────────────────────────────────────
  static const String notifications          = '/api/v1/notifications/';
  static const String notificationsMarkAllRead =
      '/api/v1/notifications/mark-all-read/';
  static const String notificationsUnreadCount =
      '/api/v1/notifications/unread-count/';
  // POST to mark a single notification read
  static String notificationMarkRead(String id) =>
      '/api/v1/notifications/$id/read/';

  // ── Analytics ────────────────────────────────────────────
  static const String analyticsDashboard     = '/api/v1/analytics/dashboard/';
  static const String analyticsPropertiesDaily =
      '/api/v1/analytics/properties/daily/';
  static const String analyticsHeatmap       = '/api/v1/analytics/heatmap/';

  // ── Health ───────────────────────────────────────────────
  static const String health = '/api/v1/health/';
}
