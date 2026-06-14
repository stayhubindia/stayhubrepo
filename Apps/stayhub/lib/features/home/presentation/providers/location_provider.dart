import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationState {
  final String city;
  final bool isLoading;
  final String? error;

  const LocationState({
    this.city = 'Locating...',
    this.isLoading = false,
    this.error,
  });

  LocationState copyWith({
    String? city,
    bool? isLoading,
    String? error,
  }) {
    return LocationState(
      city: city ?? this.city,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class LocationNotifier extends Notifier<LocationState> {
  @override
  LocationState build() {
    Future.microtask(_initLocation);
    return const LocationState(isLoading: true);
  }

  Future<void> _initLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        state = state.copyWith(isLoading: false, error: 'Location services are disabled.');
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          state = state.copyWith(isLoading: false, error: 'Location permissions are denied');
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          isLoading: false,
          error: 'Location permissions are permanently denied, we cannot request permissions.',
        );
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      List<Placemark> placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
      
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        final city = place.locality ?? place.subAdministrativeArea ?? place.administrativeArea ?? 'Unknown Location';
        state = state.copyWith(isLoading: false, city: city, error: null);
      } else {
        state = state.copyWith(isLoading: false, error: 'Could not determine city');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Location error: ${e.toString()}');
    }
  }

  Future<void> retry() async {
    state = const LocationState(isLoading: true);
    await _initLocation();
  }

  Future<void> resolveLocationIssue() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      await Geolocator.openLocationSettings();
      return; // The user will need to tap again or we can let lifecycle handle it
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.deniedForever) {
      await Geolocator.openAppSettings();
      return;
    }

    if (permission == LocationPermission.denied) {
      await Geolocator.requestPermission();
    }
    
    await retry();
  }
}

final locationProvider = NotifierProvider<LocationNotifier, LocationState>(LocationNotifier.new);
