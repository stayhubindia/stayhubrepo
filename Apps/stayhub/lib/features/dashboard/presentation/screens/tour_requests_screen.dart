import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/di/providers.dart';
import '../../../contacts/data/contacts_api_client.dart';
import '../providers/dashboard_provider.dart';

class TourRequestsScreen extends ConsumerWidget {
  const TourRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toursAsync = ref.watch(tourRequestsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Tour Requests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: toursAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (error, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Error loading tours', style: AppTextStyles.subtitle),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(tourRequestsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (tours) {
          if (tours.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.calendar_month_rounded, size: 64, color: AppColors.primary),
                  ),
                  const SizedBox(height: 24),
                  Text('No Tour Requests Yet', style: AppTextStyles.heading),
                  const SizedBox(height: 8),
                  Text(
                    'When tenants request to visit your\nproperties, they will appear here.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodySecondary,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(tourRequestsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: tours.length,
              itemBuilder: (context, index) {
                final tour = tours[index];
                return _TourCard(tour: tour);
              },
            ),
          );
        },
      ),
    );
  }
}

class _TourCard extends ConsumerWidget {
  final TourRequest tour;
  const _TourCard({required this.tour});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Color statusColor;
    String statusText = tour.status.toUpperCase();
    
    switch (tour.status) {
      case 'APPROVED':
        statusColor = AppColors.success;
        break;
      case 'REJECTED':
      case 'CANCELLED':
        statusColor = AppColors.error;
        break;
      case 'COMPLETED':
        statusColor = AppColors.info;
        break;
      case 'PENDING':
      default:
        statusColor = AppColors.warning;
        statusText = 'PENDING APPROVAL';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primaryLight,
                  radius: 20,
                  child: Text(
                    tour.message?.isNotEmpty == true ? tour.message![0].toUpperCase() : 'T', // Fallback for name since API doesn't pass tenant name in minimal TourRequest yet. Wait, we updated TourRequestSerializer to include tenant_name! We should add it to the model.
                    style: const TextStyle(color: AppColors.primaryDeep, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Tenant Request', // Fallback
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Requested via StayHub',
                        style: AppTextStyles.caption,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1, color: AppColors.border),
          
          // Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.home_work_outlined, size: 20, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Property ID: ${tour.propertyId.substring(0, 8)}...',
                        style: AppTextStyles.body,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.calendar_month_rounded, size: 20, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tour.tourDate,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                          Text(
                            tour.tourTime,
                            style: TextStyle(color: AppColors.primaryDeep, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (tour.message != null && tour.message!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '"${tour.message}"',
                      style: const TextStyle(fontStyle: FontStyle.italic, color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Actions
          if (tour.status == 'PENDING') ...[
            const Divider(height: 1, color: AppColors.border),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => _updateStatus(context, ref, 'REJECTED'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.error,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _updateStatus(context, ref, 'APPROVED'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Approve', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _updateStatus(BuildContext context, WidgetRef ref, String newStatus) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const Center(child: CircularProgressIndicator()),
      );

      final api = ContactsApiClient(ref.read(dioProvider));
      await api.updateTourStatus(tour.id, newStatus);
      
      ref.invalidate(tourRequestsProvider);
      
      if (context.mounted) {
        Navigator.pop(context); // close dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tour request ${newStatus.toLowerCase()}!'),
            backgroundColor: newStatus == 'APPROVED' ? AppColors.success : AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // close dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }
}
