import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../providers/properties_provider.dart';
import '../widgets/property_card.dart';
class PropertyListScreen extends ConsumerStatefulWidget {
  const PropertyListScreen({super.key});

  @override
  ConsumerState<PropertyListScreen> createState() => _PropertyListScreenState();
}

class _PropertyListScreenState extends ConsumerState<PropertyListScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearch(String value) {
    final current = ref.read(propertyFilterProvider);
    ref.read(propertyFilterProvider.notifier).setFilter(
        current.copyWith(search: value.isEmpty ? null : value, offset: 0));
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(propertiesProvider);
    final filter = ref.watch(propertyFilterProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Properties'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(72),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search city, locality, type…',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: AppColors.surfaceVariant,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide:
                      const BorderSide(color: AppColors.primary, width: 1.5),
                ),
              ),
              onChanged: _onSearch,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter chips row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                ...[null, 'PG', '1RK', '1BHK', '2BHK', '3BHK', 'HOUSE']
                    .map((type) {
                  final selected = filter.propertyType == type;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(type ?? 'All'),
                      selected: selected,
                      onSelected: (_) {
                        ref.read(propertyFilterProvider.notifier).setFilter(
                            filter.copyWith(propertyType: type, offset: 0));
                      },
                      selectedColor: AppColors.primaryLight,
                      checkmarkColor: AppColors.primary,
                    ),
                  );
                }),
              ],
            ),
          ),

          // Results
          Expanded(
            child: propertiesAsync.when(
              loading: () => _LoadingGrid(),
              error: (e, _) => _ErrorView(
                message: e.toString(),
                onRetry: () => ref.invalidate(propertiesProvider),
              ),
              data: (data) {
                if (data.results.isEmpty) {
                  return const _EmptyView();
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 1,
                    mainAxisExtent: 300,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: data.results.length,
                  itemBuilder: (_, i) =>
                      PropertyCard(property: data.results[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_outlined,
                size: 56, color: AppColors.textHint),
            const SizedBox(height: 16),
            Text('Failed to load properties', style: AppTextStyles.subtitle),
            const SizedBox(height: 8),
            Text(message,
                style: AppTextStyles.caption, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.home_outlined, size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text('No properties found', style: AppTextStyles.subtitle),
          const SizedBox(height: 8),
          Text('Try a different search or filter',
              style: AppTextStyles.bodySecondary),
        ],
      ),
    );
  }
}
