import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/property.dart';
import '../providers/properties_provider.dart';
import '../widgets/property_card.dart';
import '../widgets/property_map_view.dart';

class PropertyListScreen extends ConsumerStatefulWidget {
  const PropertyListScreen({super.key});

  @override
  ConsumerState<PropertyListScreen> createState() =>
      _PropertyListScreenState();
}

class _PropertyListScreenState extends ConsumerState<PropertyListScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _focusNode = FocusNode();
  bool _searchFocused = false;
  bool _showMap = false;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    _focusNode.addListener(() {
      setState(() => _searchFocused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >=
        _scrollCtrl.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  void _loadMore() {
    final data = ref.read(propertiesProvider).value;
    if (data == null || !data.hasMore) return;
    final filter = ref.read(propertyFilterProvider);
    ref.read(propertyFilterProvider.notifier).setFilter(
          filter.copyWith(offset: filter.offset + filter.limit),
        );
  }

  void _onSearch(String value) {
    final current = ref.read(propertyFilterProvider);
    ref.read(propertyFilterProvider.notifier).setFilter(
          current.copyWith(
              search: value.isEmpty ? null : value, offset: 0),
        );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheet(
        currentFilter: ref.read(propertyFilterProvider),
        onApply: (filter) {
          ref
              .read(propertyFilterProvider.notifier)
              .setFilter(filter.copyWith(offset: 0));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(propertiesProvider);
    final filter = ref.watch(propertyFilterProvider);

    final hasActiveFilters = filter.city != null ||
        filter.propertyType != null ||
        filter.minRent != null ||
        filter.maxRent != null ||
        filter.furnishing != null ||
        filter.bedrooms != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: propertiesAsync.hasValue && (propertiesAsync.value?.results.isNotEmpty ?? false)
          ? FloatingActionButton.extended(
              onPressed: () => setState(() => _showMap = !_showMap),
              backgroundColor: AppColors.textPrimary,
              icon: Icon(_showMap ? Icons.format_list_bulleted_rounded : Icons.map_rounded, color: Colors.white),
              label: Text(_showMap ? 'List' : 'Map', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            )
          : null,
      body: Column(
        children: [
          // ── Premium top search header ──────────────────────
          _SearchHeader(
            controller: _searchCtrl,
            focusNode: _focusNode,
            isFocused: _searchFocused,
            hasActiveFilters: hasActiveFilters,
            onChanged: (v) {
              setState(() {});
              _onSearch(v);
            },
            onClear: () {
              _searchCtrl.clear();
              _onSearch('');
              setState(() {});
            },
            onFilter: _showFilterSheet,
          ),

          // ── Type filter chips ──────────────────────────────
          Container(
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  null,
                  'PG',
                  '1RK',
                  '1BHK',
                  '2BHK',
                  '3BHK',
                  'HOUSE',
                  'COMMERCIAL',
                ].map((type) {
                  final selected = filter.propertyType == type;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () {
                        ref
                            .read(propertyFilterProvider.notifier)
                            .setFilter(filter.copyWith(
                                propertyType: type, offset: 0));
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primary
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Text(
                          type ?? 'All',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: selected
                                ? Colors.white
                                : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // ── Active filter summary ──────────────────────────
          if (hasActiveFilters)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Row(
                children: [
                  const Icon(Icons.filter_list_rounded,
                      size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _buildFilterSummary(filter),
                      style: AppTextStyles.caption
                          .copyWith(color: AppColors.primary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      _searchCtrl.clear();
                      ref
                          .read(propertyFilterProvider.notifier)
                          .reset();
                    },
                    child: const Text(
                      'Clear all',
                      style: TextStyle(
                          fontSize: 12,
                          color: AppColors.error,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 4),

          // ── Results ────────────────────────────────────────
          Expanded(
            child: propertiesAsync.when(
              loading: () => _LoadingList(),
              error: (e, _) => _ErrorView(
                message: e.toString(),
                onRetry: () =>
                    ref.read(propertiesProvider.notifier).retry(),
              ),
              data: (data) {
                if (data.results.isEmpty) {
                  return const _EmptyView();
                }
                
                if (_showMap) {
                  return PropertyMapView(properties: data.results);
                }

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount:
                      data.results.length + (data.hasMore ? 1 : 0),
                  itemBuilder: (_, i) {
                    if (i == data.results.length) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary),
                        ),
                      );
                    }
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: PropertyCard(property: data.results[i]),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _buildFilterSummary(PropertyFilter f) {
    final parts = <String>[];
    if (f.city != null) parts.add(f.city!);
    if (f.furnishing != null) parts.add(f.furnishing!);
    if (f.bedrooms != null) parts.add('${f.bedrooms} bed');
    if (f.minRent != null || f.maxRent != null) {
      final min = f.minRent != null ? '₹${f.minRent!.toInt()}' : '';
      final max = f.maxRent != null ? '₹${f.maxRent!.toInt()}' : '';
      if (min.isNotEmpty && max.isNotEmpty) {
        parts.add('$min–$max');
      } else if (min.isNotEmpty) {
        parts.add('Min $min');
      } else {
        parts.add('Max $max');
      }
    }
    return parts.join(' · ');
  }
}

// ── Premium Search Header ─────────────────────────────────────

class _SearchHeader extends StatelessWidget {
  const _SearchHeader({
    required this.controller,
    required this.focusNode,
    required this.isFocused,
    required this.hasActiveFilters,
    required this.onChanged,
    required this.onClear,
    required this.onFilter,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isFocused;
  final bool hasActiveFilters;
  final void Function(String) onChanged;
  final VoidCallback onClear;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              // Back button
              GestureDetector(
                onTap: () => Navigator.of(context).maybePop(),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    size: 16,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Search field
              Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 46,
                  decoration: BoxDecoration(
                    color: isFocused
                        ? Colors.white
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isFocused
                          ? AppColors.primary
                          : const Color(0xFFE2E8F0),
                      width: isFocused ? 1.5 : 1,
                    ),
                    boxShadow: isFocused
                        ? [
                            BoxShadow(
                              color: AppColors.primary
                                  .withValues(alpha: 0.12),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : [],
                  ),
                  child: TextField(
                    controller: controller,
                    focusNode: focusNode,
                    textInputAction: TextInputAction.search,
                    decoration: InputDecoration(
                      hintText: 'Search city, locality, type…',
                      hintStyle: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF94A3B8),
                      ),
                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      suffixIcon: controller.text.isNotEmpty
                          ? GestureDetector(
                              onTap: onClear,
                              child: const Icon(
                                Icons.cancel_rounded,
                                color: Color(0xFF94A3B8),
                                size: 18,
                              ),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 12),
                    ),
                    onChanged: onChanged,
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Filter button
              GestureDetector(
                onTap: onFilter,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: hasActiveFilters
                        ? AppColors.primary
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: hasActiveFilters
                          ? AppColors.primary
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Icon(
                        Icons.tune_rounded,
                        size: 20,
                        color: hasActiveFilters
                            ? Colors.white
                            : const Color(0xFF475569),
                      ),
                      if (hasActiveFilters)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Filter bottom sheet ────────────────────────────────────────

class _FilterSheet extends ConsumerStatefulWidget {
  const _FilterSheet(
      {required this.currentFilter, required this.onApply});
  final PropertyFilter currentFilter;
  final void Function(PropertyFilter) onApply;

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late String? _city;
  late String? _furnishing;
  late int? _bedrooms;
  late double? _minRent;
  late double? _maxRent;

  final _minRentCtrl = TextEditingController();
  final _maxRentCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final f = widget.currentFilter;
    _city = f.city;
    _furnishing = f.furnishing;
    _bedrooms = f.bedrooms;
    _minRent = f.minRent;
    _maxRent = f.maxRent;
    _minRentCtrl.text = f.minRent?.toInt().toString() ?? '';
    _maxRentCtrl.text = f.maxRent?.toInt().toString() ?? '';
  }

  @override
  void dispose() {
    _minRentCtrl.dispose();
    _maxRentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Filters', style: AppTextStyles.heading),
                TextButton(
                  onPressed: () => setState(() {
                    _city = null;
                    _furnishing = null;
                    _bedrooms = null;
                    _minRent = null;
                    _maxRent = null;
                    _minRentCtrl.clear();
                    _maxRentCtrl.clear();
                  }),
                  child: const Text('Reset',
                      style: TextStyle(color: AppColors.error)),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text('City',
                style: AppTextStyles.overline
                    .copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: AppConstants.popularCities.map((city) {
                final selected = _city == city;
                return ChoiceChip(
                  label: Text(city),
                  selected: selected,
                  onSelected: (_) => setState(
                      () => _city = selected ? null : city),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('Furnishing',
                style: AppTextStyles.overline
                    .copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children:
                  ['FURNISHED', 'SEMI', 'UNFURNISHED'].map((f) {
                final selected = _furnishing == f;
                return ChoiceChip(
                  label: Text(f),
                  selected: selected,
                  onSelected: (_) => setState(
                      () => _furnishing = selected ? null : f),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('Bedrooms',
                style: AppTextStyles.overline
                    .copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [1, 2, 3, 4].map((b) {
                final selected = _bedrooms == b;
                return ChoiceChip(
                  label: Text('$b BHK'),
                  selected: selected,
                  onSelected: (_) => setState(
                      () => _bedrooms = selected ? null : b),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            Text('Rent Range (₹/month)',
                style: AppTextStyles.overline
                    .copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _minRentCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Min',
                      prefixText: '₹',
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    onChanged: (v) => _minRent = double.tryParse(v),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('–',
                      style: TextStyle(
                          fontSize: 18, color: AppColors.textHint)),
                ),
                Expanded(
                  child: TextField(
                    controller: _maxRentCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Max',
                      prefixText: '₹',
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    onChanged: (v) => _maxRent = double.tryParse(v),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () {
                widget.onApply(
                  widget.currentFilter.copyWith(
                    city: _city,
                    furnishing: _furnishing,
                    bedrooms: _bedrooms,
                    minRent: _minRent,
                    maxRent: _maxRent,
                  ),
                );
                Navigator.pop(context);
              },
              child: const Text('Apply Filters'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Loading / Error / Empty ────────────────────────────────────

class _LoadingList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => Container(
        height: 240,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
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
            Text('Failed to load properties',
                style: AppTextStyles.subtitle),
            const SizedBox(height: 8),
            Text(message,
                style: AppTextStyles.caption,
                textAlign: TextAlign.center),
            const SizedBox(height: 24),
            OutlinedButton(
                onPressed: onRetry, child: const Text('Retry')),
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
          const Icon(Icons.home_outlined,
              size: 64, color: AppColors.textHint),
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
