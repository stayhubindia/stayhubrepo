import 'package:flutter/material.dart';
import '../../../../core/theme/app_text_styles.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: Center(
        child: Text('No notifications yet', style: AppTextStyles.bodySecondary),
      ),
    );
  }
}
