import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/property.dart';
import 'package:go_router/go_router.dart';

class PropertyMapView extends StatefulWidget {
  final List<Property> properties;

  const PropertyMapView({super.key, required this.properties});

  @override
  State<PropertyMapView> createState() => _PropertyMapViewState();
}

class _PropertyMapViewState extends State<PropertyMapView> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    // Calculate center based on properties or default to India
    LatLng center = const LatLng(20.5937, 78.9629); // Default India center
    
    final validProperties = widget.properties.where(
        (p) => p.latitude != null && p.longitude != null && 
               p.latitude != 0.0 && p.longitude != 0.0
    ).toList();

    if (validProperties.isNotEmpty) {
      // Find average lat/lng for center
      double sumLat = 0;
      double sumLng = 0;
      for (var p in validProperties) {
        sumLat += p.latitude!;
        sumLng += p.longitude!;
      }
      center = LatLng(sumLat / validProperties.length, sumLng / validProperties.length);
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: center,
        initialZoom: validProperties.isEmpty ? 5 : 12,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.stayhub.app',
        ),
        MarkerLayer(
          markers: validProperties.map((property) {
            return Marker(
              point: LatLng(property.latitude!, property.longitude!),
              width: 80,
              height: 40,
              alignment: Alignment.topCenter,
              child: GestureDetector(
                onTap: () {
                  context.push('/properties/${property.id}');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '₹${property.rent.toInt()}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
