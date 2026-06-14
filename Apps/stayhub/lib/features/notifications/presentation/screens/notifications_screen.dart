import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../data/notifications_api_client.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          notifAsync.maybeWhen(
            data: (list) {
              final hasUnread = list.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: () async {
                  await ref
                      .read(notificationsApiClientProvider)
                      .markAllRead();
                  ref.invalidate(notificationsProvider);
                },
                child: const Text('Mark all read'),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: notifAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.notifications_off_outlined,
                  size: 56, color: AppColors.textHint),
              const SizedBox(height: 16),
              Text('Failed to load notifications',
                  style: AppTextStyles.subtitle),
              const SizedBox(height: 8),
              Text(e.toString(),
                  style: AppTextStyles.caption,
                  textAlign: TextAlign.center),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed: () => ref.invalidate(notificationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (notifications) {
          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.notifications_outlined,
                        size: 48, color: AppColors.primary),
                  ),
                  const SizedBox(height: 20),
                  Text('All caught up!', style: AppTextStyles.subtitle),
                  const SizedBox(height: 8),
                  Text(
                    'You have no notifications right now.',
                    style: AppTextStyles.bodySecondary,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, indent: 72),
              itemBuilder: (_, i) {
                final n = notifications[i];
                return _NotificationTile(
                  notification: n,
                  onTap: () => _handleTap(context, ref, n),
                  onDismiss: () async {
                    // Server has no delete endpoint — mark as read on swipe.
                    if (!n.isRead) {
                      await ref
                          .read(notificationsApiClientProvider)
                          .markRead(n.id);
                      ref.invalidate(notificationsProvider);
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _handleTap(
      BuildContext context, WidgetRef ref, AppNotification n) async {
    // Mark as read
    if (!n.isRead) {
      await ref.read(notificationsApiClientProvider).markRead(n.id);
      ref.invalidate(notificationsProvider);
    }

    // Navigate based on type
    if (!context.mounted) return;
    if (n.relatedConversationId != null) {
      context.push('/chats/${n.relatedConversationId}',
          extra: {'title': 'Chat'});
    } else if (n.relatedPropertyId != null) {
      context.push('/properties/${n.relatedPropertyId}');
    }
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.errorLight,
        child: const Icon(Icons.delete_outline, color: AppColors.error),
      ),
      onDismissed: (_) => onDismiss(),
      child: InkWell(
        onTap: onTap,
        child: Container(
          color: notification.isRead
              ? Colors.transparent
              : AppColors.primaryLight.withValues(alpha: 0.4),
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _NotifIcon(type: notification.notificationType),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: AppTextStyles.subtitle.copyWith(
                              fontWeight: notification.isRead
                                  ? FontWeight.w500
                                  : FontWeight.w700,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      notification.message,
                      style: AppTextStyles.bodySecondary,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      timeago.format(notification.createdAt),
                      style: AppTextStyles.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotifIcon extends StatelessWidget {
  const _NotifIcon({required this.type});
  final String type;

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color bg;
    Color fg;

    switch (type) {
      case 'MESSAGE':
        icon = Icons.chat_bubble_outline;
        bg = AppColors.infoLight;
        fg = AppColors.info;
        break;
      case 'CONTACT':
        icon = Icons.person_add_outlined;
        bg = AppColors.successLight;
        fg = AppColors.success;
        break;
      case 'PROPERTY_STATUS':
        icon = Icons.home_outlined;
        bg = AppColors.warningLight;
        fg = AppColors.warning;
        break;
      default:
        icon = Icons.notifications_outlined;
        bg = AppColors.surfaceVariant;
        fg = AppColors.textSecondary;
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Icon(icon, color: fg, size: 20),
    );
  }
}
