"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Wifi, 
  Car, 
  Wind, 
  Tv, 
  Waves, 
  Dumbbell, 
  ShieldCheck, 
  Zap,
  MapPin,
  ExternalLink,
  Cigarette,
  Music,
  Dog,
  Clock,
  CheckCircle2,
  Key,
  UserCheck,
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { PropertyDetail } from "@/types/property";
import { geocodeAddress, getCachedCoordinates, cacheCoordinates } from "@/lib/geocoding";

// Lazy load the map component
const PropertyMiniMap = dynamic(
  () => import("@/components/maps/property-mini-map").then((m) => ({ default: m.PropertyMiniMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-60 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    ),
  }
);

interface OverviewTabProps {
  /** Property details to display */
  property: PropertyDetail;
}

// Amenity icon mapping
const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  ac: Wind,
  tv: Tv,
  pool: Waves,
  gym: Dumbbell,
  security: ShieldCheck,
  power: Zap,
};

/**
 * Get icon component for amenity
 */
function getAmenityIcon(amenityName: string): React.ComponentType<{ className?: string }> {
  const normalized = amenityName.toLowerCase();
  for (const [key, Icon] of Object.entries(amenityIcons)) {
    if (normalized.includes(key)) {
      return Icon;
    }
  }
  return CheckCircle2; // Default icon
}

/**
 * OverviewTab Component
 * 
 * Displays a comprehensive overview of the property including description,
 * amenities, location with interactive map, house rules, and highlights.
 */
export function OverviewTab({ property }: OverviewTabProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState(false);
  const [isEstimated, setIsEstimated] = useState(false);

  const description = property.description || "No description available.";
  const shouldTruncate = description.length > 200;
  const displayDescription = shouldTruncate && !isDescriptionExpanded 
    ? description.slice(0, 200) + "..." 
    : description;

  // Initialize map coordinates
  useEffect(() => {
    const initializeMapCoordinates = async () => {
      // Check if property has coordinates
      if (property.location?.latitude && property.location?.longitude) {
        setMapCoordinates({
          lat: parseFloat(property.location.latitude),
          lng: parseFloat(property.location.longitude),
        });
        setIsEstimated(false);
        return;
      }

      // Check cache
      const cached = getCachedCoordinates(property.id);
      if (cached) {
        setMapCoordinates(cached);
        setIsEstimated(true);
        return;
      }

      // Try geocoding if address is available
      if (property.location?.address) {
        setIsGeocoding(true);
        setGeocodingError(false);
        
        const result = await geocodeAddress(property.location.address);
        
        if (result) {
          setMapCoordinates({ lat: result.lat, lng: result.lng });
          cacheCoordinates(property.id, result.lat, result.lng);
          setIsEstimated(true);
        } else {
          setGeocodingError(true);
        }
        
        setIsGeocoding(false);
      }
    };

    initializeMapCoordinates();
  }, [property.id, property.location]);

  // Generate OpenStreetMap URL
  const openStreetMapUrl = useMemo(() => {
    if (mapCoordinates) {
      return `https://www.openstreetmap.org/?mlat=${mapCoordinates.lat}&mlon=${mapCoordinates.lng}#map=15/${mapCoordinates.lat}/${mapCoordinates.lng}`;
    }
    return null;
  }, [mapCoordinates]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id="tabpanel-overview"
      aria-labelledby="tab-overview"
      className="space-y-8 p-6"
    >
      {/* Property Description */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">About this property</h3>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {displayDescription}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            aria-expanded={isDescriptionExpanded}
          >
            {isDescriptionExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </section>

      {/* Amenities Grid */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">Amenities</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {property.amenities?.slice(0, 8).map((amenity) => {
            const Icon = getAmenityIcon(amenity.name);
            return (
              <div
                key={amenity.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Icon className="h-5 w-5 text-emerald-700" />
                </div>
                <span className="text-sm font-medium text-slate-700">{amenity.name}</span>
              </div>
            );
          })}
        </div>
        {property.amenities && property.amenities.length > 8 && (
          <button className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
            View all {property.amenities.length} amenities →
          </button>
        )}
      </section>

      {/* Location Section with Interactive Map */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">Location</h3>
        
        {/* Address */}
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-600" />
          <p className="text-sm text-slate-700">
            {property.location?.address || "Address not available"}
          </p>
        </div>

        {/* Map */}
        {isGeocoding && (
          <div className="flex h-60 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-2 text-sm text-slate-600">Loading map...</p>
            </div>
          </div>
        )}

        {!isGeocoding && geocodingError && (
          <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
              <p className="mt-2 text-sm font-medium text-red-900">Could not place this address on map precisely</p>
              <p className="mt-1 text-xs text-red-700">The address may be incomplete or invalid</p>
            </div>
          </div>
        )}

        {!isGeocoding && !geocodingError && mapCoordinates && (
          <div className="space-y-3">
            <PropertyMiniMap
              center={mapCoordinates}
              label={property.title}
              height={300}
            />
            
            {/* Map Info */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-600">
                  <span className="font-medium">Coordinates:</span>{" "}
                  {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                </div>
                {isEstimated && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Estimated from address
                  </span>
                )}
              </div>
              {openStreetMapUrl && (
                <a
                  href={openStreetMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  Open full map
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* House Rules */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">House Rules</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* No Smoking */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-red-300 hover:bg-red-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Cigarette className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No Smoking</p>
              <p className="text-xs text-slate-600">Smoking is not allowed</p>
            </div>
          </div>

          {/* No Parties */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-red-300 hover:bg-red-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Music className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No Parties</p>
              <p className="text-xs text-slate-600">Parties are not allowed</p>
            </div>
          </div>

          {/* No Pets */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-red-300 hover:bg-red-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Dog className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No Pets</p>
              <p className="text-xs text-slate-600">Pets are not allowed</p>
            </div>
          </div>

          {/* Check-out Time */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Clock className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Check-out: 11:00 AM</p>
              <p className="text-xs text-slate-600">Standard check-out time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">Highlights</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Flexible Cancellation */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:border-emerald-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Calendar className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Flexible cancellation</p>
              <p className="text-xs text-slate-600">Cancel anytime</p>
            </div>
          </div>

          {/* Self Check-in */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:border-emerald-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Key className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Self check-in</p>
              <p className="text-xs text-slate-600">Check in with keypad</p>
            </div>
          </div>

          {/* Staff Check-in */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:border-emerald-300 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <UserCheck className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Staff check-in</p>
              <p className="text-xs text-slate-600">Staff will greet you</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
