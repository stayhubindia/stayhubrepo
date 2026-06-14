class RouteNames {
  RouteNames._();

  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String onboarding = '/onboarding';
  static const String welcome = '/welcome';

  // Shell (bottom nav)
  static const String home = '/home';
  static const String properties = '/properties';
  static const String propertyDetail = '/properties/:id';
  static const String favorites = '/favorites';
  static const String chats = '/chats';
  static const String chat = '/chats/:conversationId';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';

  // Owner dashboard
  static const String dashboard = '/dashboard';
  static const String myListings = '/dashboard/listings';
  static const String addProperty = '/dashboard/listings/add';
  static const String propertyAnalytics = '/dashboard/listings/:id/analytics';
}
