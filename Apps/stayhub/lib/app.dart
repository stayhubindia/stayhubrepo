import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'features/chat/presentation/providers/global_notification_provider.dart';

final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

class StayHubApp extends ConsumerWidget {
  const StayHubApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    ref.watch(globalNotificationProvider);

    return MaterialApp.router(
      title: 'StayHub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
    );
  }
}
