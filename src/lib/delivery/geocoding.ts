/**
 * Geocoding utilities using OpenStreetMap Nominatim (free, no API key).
 * Rate limited to 1 req/s by Nominatim ToS — always call server-side.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "KhadysWaterHub/1.0 (delivery-fee-calculation)";

export interface GeocodedAddress {
  country: string;
  countryCode: string;
  region: string; // Maps to Ghana region e.g. "Greater Accra Region"
  city: string;
  district?: string;
  area?: string; // suburb / neighbourhood
  street?: string;
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
}

/**
 * Maps Nominatim state/county names to our canonical Ghana region names.
 */
const GHANA_REGION_MAP: Record<string, string> = {
  "greater accra region": "Greater Accra",
  "greater accra": "Greater Accra",
  "ashanti region": "Ashanti",
  "ashanti": "Ashanti",
  "eastern region": "Eastern",
  "eastern": "Eastern",
  "central region": "Central",
  "central": "Central",
  "western region": "Western",
  "western": "Western",
  "western north region": "Western North",
  "western north": "Western North",
  "volta region": "Volta",
  "volta": "Volta",
  "oti region": "Oti",
  "oti": "Oti",
  "bono region": "Bono",
  "bono": "Bono",
  "bono east region": "Bono East",
  "bono east": "Bono East",
  "ahafo region": "Ahafo",
  "ahafo": "Ahafo",
  "northern region": "Northern",
  "northern": "Northern",
  "savannah region": "Savannah",
  "savannah": "Savannah",
  "north east region": "North East",
  "north east": "North East",
  "upper east region": "Upper East",
  "upper east": "Upper East",
  "upper west region": "Upper West",
  "upper west": "Upper West",
};

function normaliseRegionName(raw?: string): string {
  if (!raw) return "Greater Accra";
  const lower = raw.toLowerCase().trim();
  return GHANA_REGION_MAP[lower] ?? raw;
}

/**
 * Reverse geocode: lat/lng → structured address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address ?? {};

    const region = normaliseRegionName(addr.state || addr.county || addr.region);
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const area =
      addr.suburb || addr.neighbourhood || addr.district || addr.quarter || addr.city_district || "";
    const street =
      addr.road || addr.street || addr.pedestrian || "";

    return {
      country: addr.country || "Ghana",
      countryCode: (addr.country_code || "GH").toUpperCase(),
      region,
      city,
      district: addr.county || addr.state_district || undefined,
      area,
      street,
      formattedAddress: data.display_name || `${area}, ${city}, ${region}`,
      coordinates: { lat, lng },
    };
  } catch (err) {
    console.error("[geocoding] reverseGeocode error:", err);
    return null;
  }
}

export interface SearchResult {
  placeId: string;
  displayName: string;
  coordinates: { lat: number; lng: number };
  region: string;
  city: string;
  area?: string;
  formattedAddress: string;
}

/**
 * Forward geocode: search query → list of candidate places (Ghana only)
 */
export async function forwardGeocode(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `${NOMINATIM_BASE}/search?format=jsonv2&q=${encoded}&countrycodes=gh&addressdetails=1&limit=5`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const items: any[] = await res.json();

    return items.map((item) => {
      const addr = item.address ?? {};
      const region = normaliseRegionName(addr.state || addr.county);
      const city = addr.city || addr.town || addr.village || addr.county || "";
      const area = addr.suburb || addr.neighbourhood || addr.district || "";

      return {
        placeId: String(item.place_id),
        displayName: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
        region,
        city,
        area,
        formattedAddress: item.display_name,
      };
    });
  } catch (err) {
    console.error("[geocoding] forwardGeocode error:", err);
    return [];
  }
}
