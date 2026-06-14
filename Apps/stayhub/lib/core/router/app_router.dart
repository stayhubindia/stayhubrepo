import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';

import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/providers/onboarding_provider.dart';
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
import '../../features/dashboard/presentation/screens/add_property_screen.dart';
import '../../features/dashboard/presentation/screens/edit_property_screen.dart';
import '../../features/dashboard/presentation/screens/tour_requests_screen.dart';
import '../../features/home/presentation/providers/location_provider.dart';
import 'route_names.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Bridges Riverpod auth state changes into a [ChangeNotifier] so GoRouter
/// can re-evaluate redirects without recreating the router.
class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(Ref ref) {
    ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
    ref.listen<bool>(onboardingProvider, (_, __) => notifyListeners());
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
      final isOnboardingDone = ref.read(onboardingProvider);
      
      final isAuthenticated = authState is AuthAuthenticated;
      final isLoading = authState is AuthLoading || authState is AuthInitial;
      final loc = state.matchedLocation;

      // While still checking session — stay on splash
      if (isLoading) return loc == RouteNames.splash ? null : RouteNames.splash;

      // Session resolved — leave splash
      if (loc == RouteNames.splash) {
        if (isAuthenticated) {
          return isOnboardingDone ? RouteNames.home : RouteNames.onboarding;
        } else {
          return RouteNames.login;
        }
      }

      final isAuthRoute = loc.startsWith('/login') ||
          loc.startsWith('/register') ||
          loc.startsWith('/phone-auth');

      if (!isAuthenticated && !isAuthRoute) return RouteNames.login;
      
      if (isAuthenticated) {
        if (isAuthRoute) {
          return isOnboardingDone ? RouteNames.home : RouteNames.onboarding;
        }
        
        // If authenticated but onboarding not done, restrict access to other pages
        if (!isOnboardingDone && loc != RouteNames.onboarding) {
          return RouteNames.onboarding;
        }
        
        // If onboarding is done, prevent accessing the onboarding page again
        if (isOnboardingDone && loc == RouteNames.onboarding) {
          return RouteNames.home;
        }
      }
      return null;
    },
    routes: [
      // ── Splash ────────────────────────────────────────────
      GoRoute(
        path: RouteNames.splash,
        builder: (_, __) => const SplashScreen(),
      ),

      // ── Onboarding ──────────────────────────────────────────
      GoRoute(
        path: RouteNames.onboarding,
        builder: (_, __) => const OnboardingScreen(),
      ),

      // ── Auth ──────────────────────────────────────────────
      // Welcome screen is the main auth entry point
      GoRoute(
        path: RouteNames.login,
        builder: (_, __) => const WelcomeScreen(),
      ),
      // Unified login screen (reached from WelcomeScreen via /login/email or /login/phone)
      GoRoute(
        path: '/login/:method',
        builder: (_, state) {
          final methodStr = state.pathParameters['method'];
          final method = methodStr == 'phone' ? AuthMethod.phone : AuthMethod.email;
          return LoginScreen(initialMethod: method);
        },
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
                builder: (_, s) {
                  final extra = s.extra as Map<String, dynamic>?;
                  return ChatScreen(
                    conversationId: s.pathParameters['conversationId']!,
                    otherUserName: extra?['title'] as String? ?? 'Chat',
                    propertyId: extra?['propertyId'] as String?,
                    propertyTitle: extra?['propertyTitle'] as String?,
                    propertyRent: extra?['propertyRent'] as double?,
                    propertyImage: extra?['propertyImage'] as String?,
                    propertyCity: extra?['propertyCity'] as String?,
                  );                },
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
            routes: [
              GoRoute(
                path: 'listings/add',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, __) => const AddPropertyScreen(),
              ),
              GoRoute(
                path: 'listings/:id/edit',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, s) => EditPropertyScreen(propertyId: s.pathParameters['id']!),
              ),
              GoRoute(
                path: 'tours',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (_, __) => const TourRequestsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

// ── Bottom Navigation Shell ───────────────────────────────────

// ── Bottom Navigation Shell ───────────────────────────────────

class _AppShell extends ConsumerWidget {
  const _AppShell({required this.child, required this.state});

  final Widget child;
  final GoRouterState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Eagerly trigger location permission request and fetch on app launch
    ref.watch(locationProvider);
    
    final authState = ref.watch(authProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final isOwner = user?.isOwner ?? false;
    final loc = state.matchedLocation;

    int currentIndex = 0;
    if (loc.startsWith(RouteNames.home)) {
      currentIndex = 0;
    } else if (loc.startsWith(RouteNames.chats)) {
      currentIndex = 1;
    } else if (loc.startsWith(RouteNames.properties)) {
      currentIndex = 2;
    } else if (!isOwner && loc.startsWith(RouteNames.favorites)) {
      currentIndex = 3;
    } else if (isOwner && loc.startsWith(RouteNames.dashboard)) {
      currentIndex = 3;
    } else if (loc.startsWith(RouteNames.profile)) {
      currentIndex = 4;
    }

    void navigate(int i) {
      switch (i) {
        case 0: context.go(RouteNames.home); break;
        case 1: context.go(RouteNames.chats); break;
        case 2:
          if (isOwner) {
            context.push('/dashboard/listings/add');
          } else {
            context.go(RouteNames.properties);
          }
          break;
        case 3:
          context.go(isOwner ? RouteNames.dashboard : RouteNames.favorites);
          break;
        case 4: context.go(RouteNames.profile); break;
      }
    }

    return Scaffold(
      body: child,
      extendBody: true,
      bottomNavigationBar: _StayhubBottomBar(
        currentIndex: currentIndex,
        isOwner: isOwner,
        onTap: navigate,
      ),    );
  }
}

// ── Centre Search Item (inline, lifts when active) ────────────

class _SearchItem extends StatelessWidget {
  const _SearchItem({
    required this.isActive,
    required this.isOwner,
    required this.onTap,
  });
  final bool isActive;
  final bool isOwner;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final icon = isOwner ? Icons.add_rounded : Icons.search_rounded;
    final label = isOwner ? 'Add' : 'Search';

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutBack,
              transform: Matrix4.translationValues(0, isActive ? -10 : 0, 0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOutBack,
                width: isActive ? 52 : 36,
                height: isActive ? 52 : 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: const Color(0xFF16A34A)
                                .withValues(alpha: 0.45),
                            blurRadius: 16,
                            spreadRadius: 1,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: const Color(0xFF16A34A)
                                .withValues(alpha: 0.20),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: isActive ? 28 : 18,
                ),
              ),
            ),
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 250),
              crossFadeState: isActive
                  ? CrossFadeState.showFirst
                  : CrossFadeState.showSecond,
              firstChild: Container(
                margin: const EdgeInsets.only(top: 4),
                width: 5,
                height: 5,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF16A34A),
                ),
              ),
              secondChild: Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Bottom Bar (with centre notch) ────────────────────────────

class _StayhubBottomBar extends StatelessWidget {
  const _StayhubBottomBar({
    required this.currentIndex,
    required this.isOwner,
    required this.onTap,
  });

  final int currentIndex;
  final bool isOwner;
  final void Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    return BottomAppBar(
      elevation: 0,
      color: Colors.transparent,
      padding: EdgeInsets.zero,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        height: 64,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.10),
              blurRadius: 24,
              offset: const Offset(0, 6),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 6,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            _TabItem(
              icon: Icons.home_outlined,
              activeIcon: Icons.home_rounded,
              label: 'Home',
              isActive: currentIndex == 0,
              onTap: () => onTap(0),
            ),
            _TabItem(
              icon: Icons.chat_bubble_outline_rounded,
              activeIcon: Icons.chat_bubble_rounded,
              label: 'Chat',
              isActive: currentIndex == 1,
              onTap: () => onTap(1),
            ),
            // Centre Search / Add Property
            _SearchItem(
              isActive: currentIndex == 2,
              isOwner: isOwner,
              onTap: () => onTap(2),
            ),
            _TabItem(
              icon: isOwner
                  ? Icons.bar_chart_outlined
                  : Icons.favorite_outline_rounded,
              activeIcon: isOwner
                  ? Icons.bar_chart_rounded
                  : Icons.favorite_rounded,
              label: isOwner ? 'Stats' : 'Saved',
              isActive: currentIndex == 3,
              onTap: () => onTap(3),
            ),
            _TabItem(
              icon: Icons.person_outline_rounded,
              activeIcon: Icons.person_rounded,
              label: 'Profile',
              isActive: currentIndex == 4,
              onTap: () => onTap(4),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tab Item ──────────────────────────────────────────────────
// Active:  icon lifts up, larger, green glow, dot below, label hidden
// Inactive: icon + label, grey, smaller

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon — lifts up when active, green circle background like search
            AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutBack,
              transform: Matrix4.translationValues(0, isActive ? -10 : 0, 0),
              width: isActive ? 52 : 34,
              height: isActive ? 52 : 34,
              decoration: isActive
                  ? BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF16A34A)
                              .withValues(alpha: 0.45),
                          blurRadius: 16,
                          spreadRadius: 1,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    )
                  : null,
              child: Center(
                child: Icon(
                  isActive ? activeIcon : icon,
                  color: isActive
                      ? Colors.white
                      : const Color(0xFF6B7280),
                  size: isActive ? 26 : 22,
                ),
              ),
            ),
            // Green dot when active, label when inactive
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 250),
              crossFadeState: isActive
                  ? CrossFadeState.showFirst
                  : CrossFadeState.showSecond,
              firstChild: Container(
                margin: const EdgeInsets.only(top: 4),
                width: 5,
                height: 5,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF16A34A),
                ),
              ),
              secondChild: Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
