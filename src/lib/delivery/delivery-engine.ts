import { connectDB } from "@/lib/db/mongoose";
import Settings, { ISettings } from "@/models/Settings";
import DeliveryZone, { IDeliveryZone } from "@/models/DeliveryZone";

export interface DeliveryCalculationParams {
  coordinates?: {
    lat: number;
    lng: number;
  };
  region?: string;
  city?: string;
  area?: string;
  subtotal?: number;
}

export interface DeliveryCalculationResult {
  isDeliverable: boolean;
  deliveryFee: number;
  originalFee: number;
  distanceKm?: number;
  zoneName: string;
  pricingType: "FLAT" | "DISTANCE_BASED" | "ZONE_BASED" | "REGIONAL_FALLBACK";
  estimatedDeliveryTime: string;
  isFreeDelivery: boolean;
  freeDeliveryThreshold?: number;
  storeLocation: {
    businessName: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  reason?: string;
}

// Fallback regional delivery fees in GHS
const DEFAULT_REGIONAL_RATES: Record<string, { fee: number; estTime: string }> = {
  "Greater Accra": { fee: 20, estTime: "1–3 hours" },
  "Ashanti": { fee: 25, estTime: "24–48 hours" },
  "Northern": { fee: 25, estTime: "24–48 hours" },
  "Western": { fee: 25, estTime: "24–48 hours" },
  "Eastern": { fee: 20, estTime: "24 hours" },
  "Central": { fee: 20, estTime: "24 hours" },
  "Volta": { fee: 25, estTime: "24–48 hours" },
  "Upper East": { fee: 35, estTime: "2–3 days" },
  "Upper West": { fee: 35, estTime: "2–3 days" },
  "Bono East": { fee: 25, estTime: "24–48 hours" },
  "Brong-Ahafo": { fee: 25, estTime: "24–48 hours" },
  "Ahafo": { fee: 25, estTime: "24–48 hours" },
  "Western North": { fee: 30, estTime: "24–48 hours" },
  "Oti": { fee: 30, estTime: "24–48 hours" },
  "North East": { fee: 30, estTime: "2–3 days" },
  "Savannah": { fee: 30, estTime: "2–3 days" },
};

/**
 * Calculates distance in kilometers between two GPS coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Resolves the location-based delivery fee according to:
 * 1. Customer GPS coordinates & distance from warehouse
 * 2. Active delivery zone rules & priorities
 * 3. Free delivery threshold eligibility
 * 4. Regional fallbacks when coordinates are not provided
 */
export async function resolveDeliveryFee(
  params: DeliveryCalculationParams
): Promise<DeliveryCalculationResult> {
  await connectDB();

  // 1. Fetch system settings
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  const storeLoc = settings.storeLocation || {
    businessName: "Khady's Water Hub & Warehouse",
    address: "East Legon, Boundary Road, Accra",
    region: "Greater Accra",
    city: "Accra",
    coordinates: { lat: 5.6356, lng: -0.1601 },
    defaultDeliveryFee: 20,
    pricePerKm: 2.5,
    freeDeliveryThreshold: 350,
    maxDeliveryRadiusKm: 60,
  };

  const storeCoordinates = storeLoc.coordinates?.lat
    ? storeLoc.coordinates
    : { lat: 5.6356, lng: -0.1601 };

  const storeLocationResult = {
    businessName: storeLoc.businessName || "Khady's Water Hub",
    address: storeLoc.address || "East Legon, Accra",
    coordinates: storeCoordinates,
  };

  const subtotal = params.subtotal ?? 0;
  const freeThreshold = storeLoc.freeDeliveryThreshold ?? 350;

  // 2. Fetch active delivery zones sorted by priority desc
  const activeZones = await DeliveryZone.find({ isActive: true }).sort({
    priority: -1,
  });

  // ── CASE A: Customer provided GPS Coordinates ────────────────────────────────
  if (
    params.coordinates &&
    typeof params.coordinates.lat === "number" &&
    typeof params.coordinates.lng === "number" &&
    !isNaN(params.coordinates.lat) &&
    !isNaN(params.coordinates.lng)
  ) {
    const distanceKm = calculateHaversineDistance(
      storeCoordinates.lat,
      storeCoordinates.lng,
      params.coordinates.lat,
      params.coordinates.lng
    );

    const maxRadius = storeLoc.maxDeliveryRadiusKm ?? 60;
    if (distanceKm > maxRadius) {
      return {
        isDeliverable: false,
        deliveryFee: 0,
        originalFee: 0,
        distanceKm,
        zoneName: "Outside Standard Delivery Coverage",
        pricingType: "DISTANCE_BASED",
        estimatedDeliveryTime: "Custom Logistics",
        isFreeDelivery: false,
        freeDeliveryThreshold: freeThreshold,
        storeLocation: storeLocationResult,
        reason: `Your location is ${distanceKm}km away, which exceeds our standard delivery limit of ${maxRadius}km. Please contact our support team for bulk truck delivery options.`,
      };
    }

    // Check if distance falls within a defined zone radius or region
    let matchedZone: IDeliveryZone | null = null;

    for (const zone of activeZones) {
      // Check radius match if zone has radius specified
      if (zone.radiusKm && distanceKm <= zone.radiusKm) {
        matchedZone = zone;
        break;
      }
      // Check region/area match
      if (
        params.region &&
        zone.region.toLowerCase() === params.region.toLowerCase()
      ) {
        if (
          params.area &&
          zone.areas &&
          zone.areas.some(
            (a) => a.toLowerCase() === params.area!.toLowerCase()
          )
        ) {
          matchedZone = zone;
          break;
        }
        if (!matchedZone) {
          matchedZone = zone;
        }
      }
    }

    let calculatedFee = storeLoc.defaultDeliveryFee ?? 20;
    let zoneName = "Greater Accra Distance Delivery";
    let pricingType: "FLAT" | "DISTANCE_BASED" | "ZONE_BASED" = "DISTANCE_BASED";
    let estimatedDeliveryTime =
      distanceKm <= 5 ? "45–90 minutes" : distanceKm <= 15 ? "1–3 hours" : "Same day";

    if (matchedZone) {
      zoneName = matchedZone.name;
      estimatedDeliveryTime = matchedZone.estimatedDeliveryTime;
      pricingType = matchedZone.pricingType || "FLAT";

      if (matchedZone.pricingType === "FLAT" || matchedZone.pricingType === "ZONE_BASED") {
        calculatedFee = matchedZone.deliveryFee;
      } else if (matchedZone.pricingType === "DISTANCE_BASED") {
        const baseFee = matchedZone.deliveryFee;
        const includedDist = matchedZone.includedDistanceKm ?? 3;
        const ratePerKm = matchedZone.pricePerKm ?? storeLoc.pricePerKm ?? 2.5;
        const extraDist = Math.max(0, distanceKm - includedDist);
        calculatedFee = Math.round(baseFee + extraDist * ratePerKm);
      }
    } else {
      // Default distance model from store settings:
      // Base fee for first 3km + pricePerKm for each km after
      const baseFee = storeLoc.defaultDeliveryFee ?? 20;
      const ratePerKm = storeLoc.pricePerKm ?? 2.5;
      const extraDist = Math.max(0, distanceKm - 3);
      calculatedFee = Math.round(baseFee + extraDist * ratePerKm);
      zoneName = distanceKm <= 5 ? "Accra Central Zone" : `Delivery Zone (${distanceKm}km)`;
    }

    const isFree = subtotal > 0 && subtotal >= freeThreshold;
    const finalFee = isFree ? 0 : calculatedFee;

    return {
      isDeliverable: true,
      deliveryFee: finalFee,
      originalFee: calculatedFee,
      distanceKm,
      zoneName,
      pricingType,
      estimatedDeliveryTime,
      isFreeDelivery: isFree,
      freeDeliveryThreshold: freeThreshold,
      storeLocation: storeLocationResult,
    };
  }

  // ── CASE B: Customer did not provide GPS (Region / City Fallback) ─────────────
  const targetRegion = params.region || "Greater Accra";

  // Check matching zone in DB
  const matchedZone = activeZones.find(
    (z) => z.region.toLowerCase() === targetRegion.toLowerCase()
  );

  let calculatedFee = 20;
  let estimatedDeliveryTime = "1–3 hours";
  let zoneName = `${targetRegion} Standard Delivery`;

  if (matchedZone) {
    calculatedFee = matchedZone.deliveryFee;
    estimatedDeliveryTime = matchedZone.estimatedDeliveryTime;
    zoneName = matchedZone.name;
  } else if (DEFAULT_REGIONAL_RATES[targetRegion]) {
    calculatedFee = DEFAULT_REGIONAL_RATES[targetRegion].fee;
    estimatedDeliveryTime = DEFAULT_REGIONAL_RATES[targetRegion].estTime;
  }

  const isFree = subtotal > 0 && subtotal >= freeThreshold;
  const finalFee = isFree ? 0 : calculatedFee;

  return {
    isDeliverable: true,
    deliveryFee: finalFee,
    originalFee: calculatedFee,
    zoneName,
    pricingType: "REGIONAL_FALLBACK",
    estimatedDeliveryTime,
    isFreeDelivery: isFree,
    freeDeliveryThreshold: freeThreshold,
    storeLocation: storeLocationResult,
  };
}
