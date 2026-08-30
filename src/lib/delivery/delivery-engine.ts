/**
 * DELIVERY CALCULATION ENGINE
 *
 * Priority hierarchy (Module 27):
 * 1. DeliveryException  — area override (highest priority)
 * 2. Greater Accra Zone — ZONE method: area-list or polygon match
 *                       — DISTANCE method: radius tier match
 * 3. DeliveryRegion     — fixed regional fee (outside Greater Accra)
 * 4. Default fallback   — Settings.storeLocation.defaultDeliveryFee
 * 5. Unavailable        — isDeliverable: false
 *
 * Quantity rules (per zone or region) are applied after the base fee is found.
 * Free delivery threshold is checked last and overrides everything.
 */

import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/models/Settings";
import DeliveryZone, { IDeliveryZone } from "@/models/DeliveryZone";
import DeliveryRegion from "@/models/DeliveryRegion";
import DeliveryException from "@/models/DeliveryException";
import { isPointInPolygon, haversineDistanceKm } from "./point-in-polygon";
import { IDeliverySnapshot } from "@/models/Order";

// Re-export for backward compatibility
export { haversineDistanceKm as calculateHaversineDistance } from "./point-in-polygon";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DeliveryCalculationParams {
  coordinates?: {
    lat: number;
    lng: number;
    accuracy?: number; // metres, from browser Geolocation API
  };
  region?: string;
  city?: string;
  area?: string;
  packQuantity?: number; // total packs in cart — used for quantity tier rules
  subtotal?: number;
}

export interface DeliveryCalculationResult {
  isDeliverable: boolean;
  deliveryFee: number;
  originalFee: number;
  distanceKm?: number;
  zoneName: string;
  pricingType: "ZONE" | "DISTANCE" | "REGIONAL" | "EXCEPTION" | "FREE" | "PICKUP";
  pricingRule?: string; // e.g. "4-6_PACKS"
  estimatedDeliveryTime: string;
  isFreeDelivery: boolean;
  freeDeliveryThreshold?: number;
  gpsAccuracyWarning?: boolean; // true if GPS accuracy exceeds threshold
  storeLocation: {
    businessName: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  snapshot: IDeliverySnapshot; // ready to embed in Order document
  reason?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Given a list of quantity rules, find the matching fee for packQuantity.
 * Returns null if no rule matches (fall through to base fee).
 */
function resolveQuantityFee(
  rules: { minPacks: number; maxPacks: number | null; fee: number; label?: string }[],
  packQuantity: number
): { fee: number; label: string } | null {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    const withinMin = packQuantity >= rule.minPacks;
    const withinMax = rule.maxPacks === null || packQuantity <= rule.maxPacks;
    if (withinMin && withinMax) {
      const label =
        rule.label ||
        (rule.maxPacks === null
          ? `${rule.minPacks}+ packs`
          : `${rule.minPacks}–${rule.maxPacks} packs`);
      return { fee: rule.fee, label };
    }
  }
  return null;
}

/**
 * Check if the customer area string matches any of the zone's areas.
 * Case-insensitive, partial-match friendly.
 */
function areaMatchesZone(customerArea: string, zoneAreas: string[]): boolean {
  if (!customerArea || !zoneAreas?.length) return false;
  const ca = customerArea.toLowerCase().trim();
  return zoneAreas.some(
    (za) =>
      za.toLowerCase().trim() === ca ||
      ca.includes(za.toLowerCase().trim()) ||
      za.toLowerCase().trim().includes(ca)
  );
}

// ── Main engine ────────────────────────────────────────────────────────────────

export async function resolveDeliveryFee(
  params: DeliveryCalculationParams
): Promise<DeliveryCalculationResult> {
  await connectDB();

  // Load settings
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});

  const storeLoc = settings.storeLocation;
  const delivSettings = settings.deliverySettings ?? {};

  const storeCoords = storeLoc?.coordinates?.lat
    ? storeLoc.coordinates
    : { lat: 5.6356, lng: -0.1601 };

  const storeLocationResult = {
    businessName: storeLoc?.businessName || "Khady's Water Hub",
    address: storeLoc?.address || "East Legon, Accra",
    coordinates: storeCoords,
  };

  const packQuantity = Math.max(1, params.packQuantity ?? 1);
  const subtotal = params.subtotal ?? 0;
  // Free delivery threshold is optional — only active if explicitly set > 0 by Admin
  const globalFreeThreshold =
    storeLoc?.freeDeliveryThreshold && storeLoc.freeDeliveryThreshold > 0
      ? storeLoc.freeDeliveryThreshold
      : undefined;

  // GPS accuracy check
  const accuracyThreshold = delivSettings.gpsAccuracyThresholdMeters ?? 500;
  const gpsAccuracyWarning =
    params.coordinates?.accuracy != null &&
    params.coordinates.accuracy > accuracyThreshold;

  const hasCoords =
    params.coordinates?.lat != null &&
    params.coordinates?.lng != null &&
    !isNaN(params.coordinates.lat) &&
    !isNaN(params.coordinates.lng);

  // Load all active data in parallel
  const [activeZones, activeExceptions, allRegions] = await Promise.all([
    DeliveryZone.find({ isActive: true }).sort({ priority: -1 }),
    DeliveryException.find({ isActive: true }).sort({ priority: -1 }),
    DeliveryRegion.find({}),
  ]);

  // Seed regions if empty
  if (allRegions.length === 0) {
    const { GHANA_REGIONS_SEED } = await import("@/models/DeliveryRegion");
    await DeliveryRegion.insertMany(GHANA_REGIONS_SEED);
  }

  const targetRegion = params.region || "Greater Accra";
  const targetArea = params.area || "";

  // Helper: build final result
  function buildResult(
    fee: number,
    originalFee: number,
    zoneName: string,
    pricingType: DeliveryCalculationResult["pricingType"],
    estimatedDeliveryTime: string,
    pricingRule?: string,
    distanceKm?: number,
    zoneFreeThreshold?: number
  ): DeliveryCalculationResult {
    const effectiveThreshold =
      zoneFreeThreshold !== undefined && zoneFreeThreshold > 0
        ? zoneFreeThreshold
        : globalFreeThreshold;

    const isFree = Boolean(
      effectiveThreshold &&
      effectiveThreshold > 0 &&
      subtotal > 0 &&
      subtotal >= effectiveThreshold
    );
    const finalFee = isFree ? 0 : Math.max(delivSettings.minimumDeliveryFee ?? 0, fee);

    const snapshot: IDeliverySnapshot = {
      fee: finalFee,
      originalFee,
      region: targetRegion,
      zone: zoneName !== targetRegion ? zoneName : undefined,
      calculationMethod: isFree ? "FREE" : pricingType,
      pricingRule,
      isFreeDelivery: isFree,
      packQuantity,
    };

    return {
      isDeliverable: true,
      deliveryFee: finalFee,
      originalFee,
      distanceKm,
      zoneName,
      pricingType: isFree ? "FREE" : pricingType,
      pricingRule,
      estimatedDeliveryTime,
      isFreeDelivery: isFree,
      freeDeliveryThreshold: effectiveThreshold,
      gpsAccuracyWarning,
      storeLocation: storeLocationResult,
      snapshot,
    };
  }

  // ── STEP 1: Check delivery exceptions ──────────────────────────────────────
  for (const exc of activeExceptions) {
    const matchesArea =
      targetArea && exc.areas.some(
        (a) =>
          a.toLowerCase().trim() === targetArea.toLowerCase().trim() ||
          targetArea.toLowerCase().includes(a.toLowerCase().trim())
      );
    if (matchesArea) {
      return buildResult(
        exc.fee,
        exc.fee,
        exc.name,
        "EXCEPTION",
        "Varies",
        `EXCEPTION:${exc.name}`
      );
    }
  }

  // ── STEP 2: Greater Accra zone matching ────────────────────────────────────
  const isGreaterAccra = targetRegion === "Greater Accra";
  const greaterAccraMethod = delivSettings.greaterAccraMethod ?? "ZONE";

  if (isGreaterAccra) {
    if (!delivSettings.greaterAccraEnabled) {
      return {
        isDeliverable: false,
        deliveryFee: 0,
        originalFee: 0,
        zoneName: "Greater Accra",
        pricingType: "ZONE",
        estimatedDeliveryTime: "",
        isFreeDelivery: false,
        gpsAccuracyWarning,
        storeLocation: storeLocationResult,
        snapshot: { fee: 0, originalFee: 0, region: "Greater Accra", calculationMethod: "ZONE", isFreeDelivery: false, packQuantity },
        reason: "Delivery to Greater Accra is currently unavailable.",
      };
    }

    // Greater Accra zones
    const accraZones = activeZones.filter(
      (z) => z.region.toLowerCase() === "greater accra"
    );

    if (greaterAccraMethod === "ZONE") {
      // Zone method: match by polygon first, then area-name list
      let matchedZone: IDeliveryZone | null = null;

      for (const zone of accraZones) {
        // Polygon check (if admin drew a boundary)
        if (hasCoords && zone.polygonCoordinates && zone.polygonCoordinates.length >= 3) {
          const polygon = zone.polygonCoordinates.map((p) => ({ lat: p.lat, lng: p.lng }));
          if (isPointInPolygon({ lat: params.coordinates!.lat, lng: params.coordinates!.lng }, polygon)) {
            matchedZone = zone;
            break;
          }
        }
        // Area-name list match
        if (!matchedZone && targetArea && areaMatchesZone(targetArea, zone.areas)) {
          matchedZone = zone;
          break;
        }
      }

      if (matchedZone) {
        // Apply quantity rules if any
        const qtyResult = resolveQuantityFee(matchedZone.quantityRules, packQuantity);
        const baseFee = qtyResult ? qtyResult.fee : matchedZone.deliveryFee;
        const pricingRule = qtyResult ? qtyResult.label : undefined;

        return buildResult(
          baseFee,
          matchedZone.deliveryFee,
          matchedZone.name,
          "ZONE",
          matchedZone.estimatedDeliveryTime,
          pricingRule,
          undefined,
          matchedZone.freeDeliveryThreshold
        );
      }

      // No zone matched — Greater Accra but uncovered area
      return {
        isDeliverable: false,
        deliveryFee: 0,
        originalFee: 0,
        zoneName: "Greater Accra (Uncovered Area)",
        pricingType: "ZONE",
        estimatedDeliveryTime: "",
        isFreeDelivery: false,
        gpsAccuracyWarning,
        storeLocation: storeLocationResult,
        snapshot: { fee: 0, originalFee: 0, region: "Greater Accra", calculationMethod: "ZONE", isFreeDelivery: false, packQuantity },
        reason: "Your area is not currently covered by our delivery zones. Please contact us for pricing.",
      };
    }

    // Distance method (DISTANCE): use radius tiers
    if (hasCoords) {
      const distanceKm = haversineDistanceKm(
        storeCoords.lat,
        storeCoords.lng,
        params.coordinates!.lat,
        params.coordinates!.lng
      );

      const maxRadius = storeLoc?.maxDeliveryRadiusKm ?? 60;
      if (distanceKm > maxRadius) {
        return {
          isDeliverable: false,
          deliveryFee: 0,
          originalFee: 0,
          distanceKm,
          zoneName: "Outside Delivery Coverage",
          pricingType: "DISTANCE",
          estimatedDeliveryTime: "",
          isFreeDelivery: false,
          gpsAccuracyWarning,
          storeLocation: storeLocationResult,
          snapshot: { fee: 0, originalFee: 0, region: "Greater Accra", calculationMethod: "DISTANCE", isFreeDelivery: false, packQuantity },
          reason: `Your location (${distanceKm}km) exceeds our delivery limit of ${maxRadius}km.`,
        };
      }

      // Find matching radius zone
      let matchedZone: IDeliveryZone | null = null;
      for (const zone of accraZones) {
        if (zone.radiusKm && distanceKm <= zone.radiusKm) {
          matchedZone = zone;
          break;
        }
      }

      let fee = storeLoc?.defaultDeliveryFee ?? 20;
      let zoneName = `Accra Delivery (${distanceKm}km)`;
      let estTime = "1–3 hours";
      let pricingRule: string | undefined;

      if (matchedZone) {
        zoneName = matchedZone.name;
        estTime = matchedZone.estimatedDeliveryTime;

        if (matchedZone.pricingType === "DISTANCE_BASED") {
          const baseFee = matchedZone.deliveryFee;
          const included = matchedZone.includedDistanceKm ?? 3;
          const ratePerKm = matchedZone.pricePerKm ?? storeLoc?.pricePerKm ?? 2.5;
          fee = Math.round(baseFee + Math.max(0, distanceKm - included) * ratePerKm);
        } else {
          fee = matchedZone.deliveryFee;
        }

        // Quantity rules on top
        const qtyResult = resolveQuantityFee(matchedZone.quantityRules, packQuantity);
        if (qtyResult) {
          fee = qtyResult.fee;
          pricingRule = qtyResult.label;
        }
      } else {
        // Fallback distance model
        const ratePerKm = storeLoc?.pricePerKm ?? 2.5;
        fee = Math.round((storeLoc?.defaultDeliveryFee ?? 20) + Math.max(0, distanceKm - 3) * ratePerKm);
      }

      return buildResult(fee, fee, zoneName, "DISTANCE", estTime, pricingRule, distanceKm);
    }

    // Greater Accra but no coords and DISTANCE method — use first accra zone fallback
    const fallbackZone = accraZones[0];
    if (fallbackZone) {
      const qtyResult = resolveQuantityFee(fallbackZone.quantityRules, packQuantity);
      const fee = qtyResult ? qtyResult.fee : fallbackZone.deliveryFee;
      return buildResult(fee, fallbackZone.deliveryFee, fallbackZone.name, "ZONE", fallbackZone.estimatedDeliveryTime, qtyResult?.label);
    }
  }

  // ── STEP 3: Other regions ──────────────────────────────────────────────────
  const enabledRegions = await DeliveryRegion.find({ isEnabled: true });
  const matchedRegion = enabledRegions.find(
    (r) => r.name.toLowerCase() === targetRegion.toLowerCase()
  );

  if (!matchedRegion) {
    // Check if we know the region but it's disabled
    const allRegionsList = await DeliveryRegion.find({});
    const knownRegion = allRegionsList.find(
      (r) => r.name.toLowerCase() === targetRegion.toLowerCase()
    );

    return {
      isDeliverable: false,
      deliveryFee: 0,
      originalFee: 0,
      zoneName: targetRegion,
      pricingType: "REGIONAL",
      estimatedDeliveryTime: "",
      isFreeDelivery: false,
      gpsAccuracyWarning,
      storeLocation: storeLocationResult,
      snapshot: { fee: 0, originalFee: 0, region: targetRegion, calculationMethod: "REGIONAL", isFreeDelivery: false, packQuantity },
      reason: knownRegion
        ? `Delivery to ${targetRegion} is currently unavailable.`
        : `We don't currently deliver to ${targetRegion}.`,
    };
  }

  // Apply quantity rules
  const qtyResult = resolveQuantityFee(matchedRegion.quantityRules, packQuantity);
  const baseFee = qtyResult ? qtyResult.fee : matchedRegion.baseFee;
  const pricingRule = qtyResult ? qtyResult.label : undefined;

  return buildResult(
    baseFee,
    matchedRegion.baseFee,
    matchedRegion.name,
    "REGIONAL",
    matchedRegion.estimatedDeliveryTime,
    pricingRule
  );
}
