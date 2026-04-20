import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/properties/presentation/screens/property_list_screen.dart';
import '../../features/properties/presentation/screens/property_detail_screen.dart';
import '../../features/favorites/presentation/screens/favorites_screen.dart';
import '../../features/chat/presentation/screens/conversations_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/edit_profile_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import 'route_names.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Bridges Riverpod auth state changes into a [ChangeNotifier] so GoRouter
/// can re-evaluate redirects without recreating the router.
class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(Ref ref) {
    ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: RouteNames.splash,
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState is AuthAuthenticated;
      final isLoading = authState is AuthLoading || authState is AuthInitial;
      final loc = state.matchedLocation;

      // While still checking session — stay on splash
      if (isLoading) return loc == RouteNames.splash ? null : RouteNames.splash;

      // Session resolved — leave splash
      if (loc == RouteNames.splash) {
        return isAuthenticated ? RouteNames.home : RouteNames.login;
      }

      final isAuthRoute = loc.startsWith('/login') ||
          loc.startsWith('/register') ||
          loc.startsWith('/onboarding');

      if (!isAuthenticated && !isAuthRoute) return RouteNames.login;
      if (isAuthenticated && isAuthRoute) return RouteNames.home;
      return null;
    },
    routes: [
      // ── Splash ────────────────────────────────────────────
      GoRoute(
        path: RouteNames.splash,
        builder: (_, __) => const SplashScreen(),
      ),

      // ── Auth ──────────────────────────────────────────────
      GoRoute(
        path: RouteNames.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.register,
        builder: (_, __) => const RegisterScreen(),
      ),

      // ── Shell (bottom nav) ────────────────────────────────
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) =>
            _AppShell(state: state, child: child),
        routes: [
          GoRoute(
            path: RouteNames.home,
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: RouteNames.properties,
            builder: (_, __) => const PropertyListScreen(),
            routes: [
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, s) =>
                    PropertyDetailScreen(propertyId: s.pathParameters['id']!),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.favorites,
            builder: (_, __) => const FavoritesScreen(),
          ),
          GoRoute(
            path: RouteNames.chats,
            builder: (_, __) => const ConversationsScreen(),
            routes: [
              GoRoute(
                path: ':conversationId',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, s) => ChatScreen(
                  conversationId: s.pathParameters['conversationId']!,
                  otherUserName: (s.extra as Map<String, dynamic>?)?['title']
                          as String? ??
                      'Chat',
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.notifications,
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: RouteNames.profile,
            builder: (_, __) => const ProfileScreen(),
            routes: [
              GoRoute(
                path: 'edit',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, __) => const EditProfileScreen(),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.dashboard,
            builder: (_, __) => const DashboardScreen(),
          ),
        ],
      ),
    ],
  );
});

// ── Bottom Navigation Shell ───────────────────────────────────

class _AppShell extends ConsumerWidget {
  const _AppShell({required this.child, required this.state});

  final Widget child;
  final GoRouterState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = (ref.watch(authProvider) as AuthAuthenticated?)?.user;
    final isOwner = user?.isOwner ?? false;
    final loc = state.matchedLocation;

    final tabs = [
      RouteNames.home,
      RouteNames.properties,
      if (!isOwner) RouteNames.favorites,
      if (isOwner) RouteNames.dashboard,
      RouteNames.chats,
      RouteNames.profile,
    ];

    int currentIndex = tabs.indexWhere((t) => loc.startsWith(t));
    if (currentIndex < 0) currentIndex = 0;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: BottomNavigationBar(
            currentIndex: currentIndex,
            onTap: (i) => context.go(tabs[i]),
            elevation: 0,
            backgroundColor: Colors.white,
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home_rounded),
                label: 'Home',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.search_outlined),
                activeIcon: Icon(Icons.search_rounded),
                label: 'Explore',
              ),
              if (!isOwner)
                const BottomNavigationBarItem(
                  icon: Icon(Icons.bookmark_border_outlined),
                  activeIcon: Icon(Icons.bookmark_rounded),
                  label: 'Saved',
                ),
              if (isOwner)
                const BottomNavigationBarItem(
                  icon: Icon(Icons.bar_chart_outlined),
                  activeIcon: Icon(Icons.bar_chart_rounded),
                  label: 'Dashboard',
                ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.chat_bubble_outline),
                activeIcon: Icon(Icons.chat_bubble_rounded),
                label: 'Chats',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person_rounded),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
