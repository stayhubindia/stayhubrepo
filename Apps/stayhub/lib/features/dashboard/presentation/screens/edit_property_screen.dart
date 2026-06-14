import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../properties/data/properties_api_client.dart';
import '../../../properties/presentation/providers/amenities_provider.dart';
import '../../../../core/di/providers.dart';
import '../providers/dashboard_provider.dart';

class EditPropertyScreen extends ConsumerStatefulWidget {
  const EditPropertyScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<EditPropertyScreen> createState() =>
      _EditPropertyScreenState();
}

class _EditPropertyScreenState extends ConsumerState<EditPropertyScreen> {
  final _pageCtrl = PageController();
  int _currentPage = 0;
  bool _isSaving = false;
  bool _isLoading = true;

  // ── Form keys ──────────────────────────────────────────────
  final _basicKey = GlobalKey<FormState>();
  final _locationKey = GlobalKey<FormState>();
  final _detailsKey = GlobalKey<FormState>();

  // ── Basic info ─────────────────────────────────────────────
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _propertyType = 'PG';

  // ── Location ───────────────────────────────────────────────
  final _addressCtrl = TextEditingController();
  final _localityCtrl = TextEditingController();
  String? _city;
  final _stateCtrl = TextEditingController();
  final _pincodeCtrl = TextEditingController();
  double? _latitude;
  double? _longitude;
  bool _isFetchingLocation = false;

  // ── Details ────────────────────────────────────────────────
  final _rentCtrl = TextEditingController();
  final _depositCtrl = TextEditingController();
  String _furnishing = 'UNFURNISHED';
  String _preferredTenant = 'ANY';
  int? _bedrooms;
  int? _bathrooms;
  final _areaCtrl = TextEditingController();

  // ── Media & Extras ───────────────────────────────────────────
  final _mediaKey = GlobalKey<FormState>();
  List<String> _imagePaths = [];
  DateTime? _availableFrom = DateTime.now();
  List<String> _selectedAmenities = [];

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  Future<void> _loadProperty() async {
    try {
      final api = PropertiesApiClient(ref.read(dioProvider));
      final property = await api.getProperty(widget.propertyId);

      _titleCtrl.text = property.title;
      _descCtrl.text = property.description;
      _propertyType = property.propertyType;
      
      _addressCtrl.text = property.locationAddress ?? '';
      _localityCtrl.text = property.locationLocality ?? '';
      _city = property.locationCity;
      _stateCtrl.text = property.locationState ?? '';
      _pincodeCtrl.text = property.locationPincode ?? '';
      _latitude = property.latitude;
      _longitude = property.longitude;
      
      _rentCtrl.text = property.rent.toString();
      _depositCtrl.text = property.deposit?.toString() ?? '';
      _furnishing = property.furnishing;
      _preferredTenant = property.preferredTenant ?? 'ANY';
      _bedrooms = property.bedrooms;
      _bathrooms = property.bathrooms;
      _areaCtrl.text = property.areaSqft?.toString() ?? '';
      
      if (property.availableFrom != null) {
        _availableFrom = DateTime.tryParse(property.availableFrom!);
      } else {
        _availableFrom = DateTime.now();
      }

      _selectedAmenities = property.amenities.map((a) => a.id).toList();
      _imagePaths = property.images.map((img) => img).toList();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load property: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _addressCtrl.dispose();
    _localityCtrl.dispose();
    _stateCtrl.dispose();
    _pincodeCtrl.dispose();
    _rentCtrl.dispose();
    _depositCtrl.dispose();
    _areaCtrl.dispose();
    super.dispose();
  }

  void _nextPage() {
    bool valid = false;
    if (_currentPage == 0) valid = _basicKey.currentState!.validate();
    if (_currentPage == 1) {
      if (_latitude == null || _longitude == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fetch your GPS location first')),
        );
        return;
      }
      valid = _locationKey.currentState!.validate();
    }
    if (_currentPage == 2) valid = _detailsKey.currentState!.validate();
    if (_currentPage == 3) {
      if (_imagePaths.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please add at least one image')),
        );
        return;
      }
      valid = _mediaKey.currentState?.validate() ?? true;
    }

    if (!valid) return;

    if (_currentPage < 3) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submit();
    }
  }

  void _prevPage() {
    _pageCtrl.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _fetchLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled. Please enable GPS.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied, we cannot request permissions.');
      }

      Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
      });

      List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        setState(() {
          final addressParts = [
            place.name,
            place.street,
            place.thoroughfare,
            place.subLocality,
          ].where((p) => p != null && p.isNotEmpty).toSet().toList();
          if (addressParts.isNotEmpty) {
            _addressCtrl.text = addressParts.join(', ');
          }
          if (place.subLocality != null && place.subLocality!.isNotEmpty) {
            _localityCtrl.text = place.subLocality!;
          }
          if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
            _stateCtrl.text = place.administrativeArea!;
          }
          if (place.postalCode != null && place.postalCode!.isNotEmpty) {
            _pincodeCtrl.text = place.postalCode!;
          }
          if (place.locality != null && AppConstants.popularCities.contains(place.locality)) {
            _city = place.locality;
          }
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location fetched and fields pre-filled!'), backgroundColor: AppColors.success),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _isFetchingLocation = false);
    }
  }

  Future<void> _submit() async {
    setState(() => _isSaving = true);
    try {
      final api = PropertiesApiClient(ref.read(dioProvider));
      final property = await api.updateProperty(widget.propertyId, {
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'property_type': _propertyType,
        'furnishing': _furnishing,
        'preferred_tenant': _preferredTenant,
        'rent': double.parse(_rentCtrl.text.trim()),
        'deposit': _depositCtrl.text.trim().isNotEmpty ? double.parse(_depositCtrl.text.trim()) : null,
        'bedrooms': _bedrooms,
        'bathrooms': _bathrooms,
        'area_sqft': _areaCtrl.text.trim().isNotEmpty ? int.parse(_areaCtrl.text.trim()) : null,
        'available_from': _availableFrom?.toIso8601String().split('T')[0],
        if (_selectedAmenities.isNotEmpty)
          'amenity_ids': _selectedAmenities,
        'address': _addressCtrl.text.trim(),
        'locality': _localityCtrl.text.trim(),
        if (_city != null) 'city': _city,
        'state': _stateCtrl.text.trim(),
        'pincode': _pincodeCtrl.text.trim(),
        if (_latitude != null) 'lat': _latitude!.toStringAsFixed(10),
        if (_longitude != null) 'lng': _longitude!.toStringAsFixed(10),
      });

      for (int i = 0; i < _imagePaths.length; i++) {
        final path = _imagePaths[i];
        if (!path.startsWith('http')) {
          await api.uploadPropertyImage(property.id, path, isPrimary: i == 0);
        }
      }

      ref.invalidate(myListingsProvider);
      ref.invalidate(dashboardStatsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Property updated!'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
          ),
        );
        context.pop();
        context.push('/properties/${property.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const steps = ['Basic Info', 'Location', 'Details', 'Media'];

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Property'),
        leading: _currentPage > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                onPressed: _prevPage,
              )
            : null,
      ),
      body: Column(
        children: [
          // ── Step indicator ─────────────────────────────────
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: List.generate(steps.length, (i) {
                final isActive = i == _currentPage;
                final isDone = i < _currentPage;
                return Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Row(
                              children: [
                                if (i > 0)
                                  Expanded(
                                    child: Container(
                                      height: 2,
                                      color: isDone
                                          ? AppColors.primary
                                          : AppColors.border,
                                    ),
                                  ),
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: isActive || isDone
                                        ? AppColors.primary
                                        : AppColors.surfaceVariant,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isActive || isDone
                                          ? AppColors.primary
                                          : AppColors.border,
                                    ),
                                  ),
                                  child: Center(
                                    child: isDone
                                        ? const Icon(Icons.check,
                                            color: Colors.white, size: 14)
                                        : Text(
                                            '${i + 1}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: isActive
                                                  ? Colors.white
                                                  : AppColors.textHint,
                                            ),
                                          ),
                                  ),
                                ),
                                if (i < steps.length - 1)
                                  Expanded(
                                    child: Container(
                                      height: 2,
                                      color: isDone
                                          ? AppColors.primary
                                          : AppColors.border,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              steps[i],
                              style: AppTextStyles.caption.copyWith(
                                color: isActive
                                    ? AppColors.primary
                                    : AppColors.textHint,
                                fontWeight: isActive
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),

          // ── Pages ──────────────────────────────────────────
          Expanded(
            child: PageView(
              controller: _pageCtrl,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentPage = i),
              children: [
                _BasicInfoPage(
                  formKey: _basicKey,
                  titleCtrl: _titleCtrl,
                  descCtrl: _descCtrl,
                  propertyType: _propertyType,
                  onTypeChanged: (v) =>
                      setState(() => _propertyType = v),
                ),
                  _LocationPage(
                    formKey: _locationKey,
                    addressCtrl: _addressCtrl,
                    localityCtrl: _localityCtrl,
                    city: _city,
                    stateCtrl: _stateCtrl,
                    pincodeCtrl: _pincodeCtrl,
                    latitude: _latitude,
                    longitude: _longitude,
                    isFetchingLocation: _isFetchingLocation,
                    onFetchLocation: _fetchLocation,
                    onCityChanged: (val) {
                      setState(() => _city = val);
                    },
                  ),
                _DetailsPage(
                  formKey: _detailsKey,
                  rentCtrl: _rentCtrl,
                  depositCtrl: _depositCtrl,
                  areaCtrl: _areaCtrl,
                  furnishing: _furnishing,
                  preferredTenant: _preferredTenant,
                  bedrooms: _bedrooms,
                  bathrooms: _bathrooms,
                  onFurnishingChanged: (v) =>
                      setState(() => _furnishing = v),
                  onTenantChanged: (v) =>
                      setState(() => _preferredTenant = v),
                  onBedroomsChanged: (v) =>
                      setState(() => _bedrooms = v),
                  onBathroomsChanged: (v) =>
                      setState(() => _bathrooms = v),
                ),
                _MediaPage(
                  formKey: _mediaKey,
                  imagePaths: _imagePaths,
                  availableFrom: _availableFrom,
                  selectedAmenities: _selectedAmenities,
                  onDateChanged: (v) => setState(() => _availableFrom = v),
                  onAddImages: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickMultiImage();
                    if (picked.isNotEmpty) {
                      setState(() {
                        _imagePaths.addAll(picked.map((e) => e.path));
                      });
                    }
                  },
                  onRemoveImage: (index) {
                    setState(() {
                      _imagePaths.removeAt(index);
                    });
                  },
                  onAmenityToggled: (id) {
                    setState(() {
                      if (_selectedAmenities.contains(id)) {
                        _selectedAmenities.remove(id);
                      } else {
                        _selectedAmenities.add(id);
                      }
                    });
                  },
                ),
              ],
            ),
          ),

          // ── Bottom button ──────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: ElevatedButton(
                onPressed: _isSaving ? null : _nextPage,
                child: _isSaving
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2.5),
                      )
                    : Text(_currentPage < 3 ? 'Continue' : 'Save Changes'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Page 1: Basic Info ─────────────────────────────────────────

class _BasicInfoPage extends StatelessWidget {
  const _BasicInfoPage({
    required this.formKey,
    required this.titleCtrl,
    required this.descCtrl,
    required this.propertyType,
    required this.onTypeChanged,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController titleCtrl;
  final TextEditingController descCtrl;
  final String propertyType;
  final void Function(String) onTypeChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Property Type',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: AppConstants.propertyTypes.map((type) {
                final selected = propertyType == type;
                return ChoiceChip(
                  label: Text(type),
                  selected: selected,
                  onSelected: (_) => onTypeChanged(type),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            TextFormField(
              controller: titleCtrl,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Listing title *',
                hintText: 'e.g. Spacious 2BHK in Koramangala',
                prefixIcon: Icon(Icons.title_outlined),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) {
                  return 'Title is required';
                }
                if (v.trim().length < 10) {
                  return 'Title must be at least 10 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: descCtrl,
              maxLines: 5,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description *',
                hintText:
                    'Describe the property, nearby landmarks, rules…',
                alignLabelWithHint: true,
                prefixIcon: Padding(
                  padding: EdgeInsets.only(bottom: 64),
                  child: Icon(Icons.description_outlined),
                ),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) {
                  return 'Description is required';
                }
                if (v.trim().length < 20) {
                  return 'Description must be at least 20 characters';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Page 2: Location ───────────────────────────────────────────

class _LocationPage extends StatelessWidget {
  const _LocationPage({
    required this.formKey,
    required this.addressCtrl,
    required this.localityCtrl,
    required this.city,
    required this.stateCtrl,
    required this.pincodeCtrl,
    required this.latitude,
    required this.longitude,
    required this.isFetchingLocation,
    required this.onFetchLocation,
    required this.onCityChanged,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController addressCtrl;
  final TextEditingController localityCtrl;
  final String? city;
  final TextEditingController stateCtrl;
  final TextEditingController pincodeCtrl;
  final double? latitude;
  final double? longitude;
  final bool isFetchingLocation;
  final VoidCallback onFetchLocation;
  final void Function(String?) onCityChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: latitude != null ? AppColors.success : AppColors.primaryLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Icon(Icons.gps_fixed, color: latitude != null ? AppColors.success : AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          latitude != null ? 'GPS Location Acquired' : 'Mandatory GPS Location',
                          style: TextStyle(fontWeight: FontWeight.bold, color: latitude != null ? AppColors.success : AppColors.textPrimary),
                        ),
                      ),
                      if (latitude != null) const Icon(Icons.check_circle, color: AppColors.success),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    latitude != null
                        ? 'Coordinates: ${latitude!.toStringAsFixed(10)}, ${longitude!.toStringAsFixed(10)}'
                        : 'We need your precise location to show the property accurately on the map. This will also auto-fill your address below.',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: isFetchingLocation ? null : onFetchLocation,
                    icon: isFetchingLocation
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : Icon(latitude != null ? Icons.refresh : Icons.my_location),
                    label: Text(latitude != null ? 'Update Location' : 'Fetch Current Location'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: latitude != null ? Colors.white : AppColors.primary,
                      foregroundColor: latitude != null ? AppColors.primary : Colors.white,
                      side: BorderSide(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: addressCtrl,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Street address *',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Address is required'
                  : null,
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: localityCtrl,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Locality / Area *',
                prefixIcon: Icon(Icons.map_outlined),
              ),
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Locality is required'
                  : null,
            ),
            const SizedBox(height: 16),

            // City dropdown
            Text('City *',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: AppConstants.popularCities.map((c) {
                final selected = city == c;
                return ChoiceChip(
                  label: Text(c),
                  selected: selected,
                  onSelected: (_) =>
                      onCityChanged(selected ? null : c),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            if (city == null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('Please select a city',
                    style: AppTextStyles.caption
                        .copyWith(color: AppColors.error)),
              ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: stateCtrl,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'State *',
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Required'
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: pincodeCtrl,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'Pincode *',
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return 'Required';
                      }
                      if (!RegExp(r'^\d{6}$').hasMatch(v.trim())) {
                        return '6 digits';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Page 3: Details ────────────────────────────────────────────

class _DetailsPage extends StatelessWidget {
  const _DetailsPage({
    required this.formKey,
    required this.rentCtrl,
    required this.depositCtrl,
    required this.areaCtrl,
    required this.furnishing,
    required this.preferredTenant,
    required this.bedrooms,
    required this.bathrooms,
    required this.onFurnishingChanged,
    required this.onTenantChanged,
    required this.onBedroomsChanged,
    required this.onBathroomsChanged,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController rentCtrl;
  final TextEditingController depositCtrl;
  final TextEditingController areaCtrl;
  final String furnishing;
  final String preferredTenant;
  final int? bedrooms;
  final int? bathrooms;
  final void Function(String) onFurnishingChanged;
  final void Function(String) onTenantChanged;
  final void Function(int?) onBedroomsChanged;
  final void Function(int?) onBathroomsChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Rent & Deposit
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: rentCtrl,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Monthly Rent *',
                      prefixText: '₹ ',
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return 'Rent is required';
                      }
                      if (double.tryParse(v.trim()) == null) {
                        return 'Enter a valid amount';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: depositCtrl,
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Deposit',
                      prefixText: '₹ ',
                    ),
                    validator: (v) {
                      if (v != null &&
                          v.trim().isNotEmpty &&
                          double.tryParse(v.trim()) == null) {
                        return 'Invalid amount';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: areaCtrl,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.done,
              decoration: const InputDecoration(
                labelText: 'Area (sqft)',
                suffixText: 'sqft',
              ),
            ),
            const SizedBox(height: 20),

            // Furnishing
            Text('Furnishing',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: AppConstants.furnishingTypes.map((f) {
                final selected = furnishing == f;
                return ChoiceChip(
                  label: Text(f),
                  selected: selected,
                  onSelected: (_) => onFurnishingChanged(f),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Bedrooms
            Text('Bedrooms',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [null, 1, 2, 3, 4].map((b) {
                final selected = bedrooms == b;
                return ChoiceChip(
                  label: Text(b == null ? 'Studio' : '$b BHK'),
                  selected: selected,
                  onSelected: (_) => onBedroomsChanged(selected ? null : b),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Bathrooms
            Text('Bathrooms',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: [1, 2, 3].map((b) {
                final selected = bathrooms == b;
                return ChoiceChip(
                  label: Text('$b'),
                  selected: selected,
                  onSelected: (_) =>
                      onBathroomsChanged(selected ? null : b),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Preferred tenant
            Text('Preferred Tenant',
                style:
                    AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: AppConstants.preferredTenantOptions.map((t) {
                final selected = preferredTenant == t;
                return ChoiceChip(
                  label: Text(t),
                  selected: selected,
                  onSelected: (_) => onTenantChanged(t),
                  selectedColor: AppColors.primaryLight,
                  checkmarkColor: AppColors.primary,
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Page 4: Media & Extras ─────────────────────────────────────

class _MediaPage extends ConsumerWidget {
  const _MediaPage({
    required this.formKey,
    required this.imagePaths,
    required this.onAddImages,
    required this.onRemoveImage,
    required this.availableFrom,
    required this.onDateChanged,
    required this.selectedAmenities,
    required this.onAmenityToggled,
  });

  final GlobalKey<FormState> formKey;
  final List<String> imagePaths;
  final VoidCallback onAddImages;
  final void Function(int) onRemoveImage;
  final DateTime? availableFrom;
  final void Function(DateTime?) onDateChanged;
  final List<String> selectedAmenities;
  final void Function(String) onAmenityToggled;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Property Images *', style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ...imagePaths.asMap().entries.map((e) {
                  return Stack(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: DecorationImage(
                            image: e.value.startsWith('http')
                                ? NetworkImage(e.value) as ImageProvider
                                : FileImage(File(e.value)),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => onRemoveImage(e.key),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close, size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                      if (e.key == 0)
                        Positioned(
                          bottom: 4,
                          left: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('Cover', style: TextStyle(color: Colors.white, fontSize: 10)),
                          ),
                        ),
                    ],
                  );
                }),
                GestureDetector(
                  onTap: onAddImages,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_photo_alternate_outlined, color: AppColors.primary),
                        SizedBox(height: 4),
                        Text('Add Photos', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text('Available From', style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: availableFrom ?? DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                  onDateChanged(date);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 20, color: AppColors.textSecondary),
                    const SizedBox(width: 12),
                    Text(
                      availableFrom != null 
                        ? '${availableFrom!.day}/${availableFrom!.month}/${availableFrom!.year}'
                        : 'Select Date',
                      style: TextStyle(
                        color: availableFrom != null ? AppColors.textPrimary : AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Amenities', style: AppTextStyles.overline.copyWith(letterSpacing: 1.2)),
            const SizedBox(height: 10),
            ref.watch(amenitiesProvider).when(
              data: (amenities) {
                if (amenities.isEmpty) return const Text('No amenities available', style: TextStyle(color: AppColors.textHint));
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: amenities.map((a) {
                    final selected = selectedAmenities.contains(a.id);
                    return FilterChip(
                      label: Text(a.name),
                      selected: selected,
                      onSelected: (_) => onAmenityToggled(a.id),
                      selectedColor: AppColors.primaryLight,
                      checkmarkColor: AppColors.primary,
                      backgroundColor: AppColors.surfaceVariant,
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
              error: (err, _) => Text('Error loading amenities: $err', style: const TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      ),
    );
  }
}
