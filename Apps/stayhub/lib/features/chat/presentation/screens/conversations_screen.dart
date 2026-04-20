import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../providers/chat_provider.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convsAsync = ref.watch(conversationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Chats')),
      body: convsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.chat_bubble_outline,
                  size: 56, color: AppColors.textHint),
              const SizedBox(height: 16),
              Text(e.toString(), style: AppTextStyles.bodySecondary),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => ref.invalidate(conversationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (conversations) {
          if (conversations.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.forum_outlined,
                      size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  Text('No conversations yet', style: AppTextStyles.subtitle),
                  const SizedBox(height: 8),
                  Text(
                    'Contact an owner from a property listing to start chatting.',
                    style: AppTextStyles.bodySecondary,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(conversationsProvider),
            child: ListView.separated(
              itemCount: conversations.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final conv = conversations[i];
                return ListTile(
                  onTap: () => context.push(
                    '/chats/${conv.id}',
                    extra: {'title': conv.otherUserName},
                  ),
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primaryLight,
                    child: Text(
                      conv.otherUserName.isNotEmpty
                          ? conv.otherUserName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(conv.otherUserName, style: AppTextStyles.subtitle),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(conv.propertyTitle,
                          style: AppTextStyles.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                      if (conv.lastMessage != null)
                        Text(conv.lastMessage!,
                            style: AppTextStyles.bodySecondary,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        DateFormat('d MMM').format(conv.updatedAt),
                        style: AppTextStyles.caption,
                      ),
                      if (conv.unreadCount > 0) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${conv.unreadCount}',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 11),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
