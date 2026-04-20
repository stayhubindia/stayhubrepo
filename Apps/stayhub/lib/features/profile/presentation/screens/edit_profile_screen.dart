import 'package:flutter/material.dart';
import '../../../../core/theme/app_text_styles.dart';

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: Center(
        child: Text('Edit profile coming soon', style: AppTextStyles.bodySecondary),
      ),
    );
  }
}
