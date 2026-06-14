import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/providers.dart';
import '../../data/notifications_api_client.dart';

// ── API client ────────────────────────────────────────────────
final notificationsApiClientProvider = Provider(
  (ref) => NotificationsApiClient(ref.read(dioProvider)),
);

// ── Notifications list ────────────────────────────────────────
final notificationsProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  return ref.read(notificationsApiClientProvider).getNotifications();
});

// ── Unread count (for badge) ──────────────────────────────────
final unreadNotificationsCountProvider =
    FutureProvider.autoDispose<int>((ref) async {
  final notifications = await ref.watch(notificationsProvider.future);
  return notifications.where((n) => !n.isRead).length;
});
