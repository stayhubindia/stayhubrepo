/**
 * Geocoding utility for converting addresses to coordinates
 * Uses Nominatim (OpenStreetMap) geocoding service
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}

/**
 * Geocode an address to coordinates using Nominatim API
 * @param address - Full address string to geocode
 * @returns Promise with lat/lng coordinates or null if failed
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'StayHub Property Dashboard',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results found for address:', address);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Cache key for storing geocoded coordinates in localStorage
 */
export function getGeocodeStorageKey(propertyId: string): string {
  return `property-map-coords:${propertyId}`;
}

/**
 * Get cached coordinates from localStorage
 */
export function getCachedCoordinates(propertyId: string): { lat: number; lng: number } | null {
  try {
    const key = getGeocodeStorageKey(propertyId);
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading cached coordinates:', error);
  }
  return null;
}

/**
 * Cache coordinates in localStorage
 */
export function cacheCoordinates(propertyId: string, lat: number, lng: number): void {
  try {
    const key = getGeocodeStorageKey(propertyId);
    localStorage.setItem(key, JSON.stringify({ lat, lng }));
  } catch (error) {
    console.error('Error caching coordinates:', error);
  }
}
