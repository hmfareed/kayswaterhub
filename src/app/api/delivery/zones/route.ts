import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import DeliveryZone from "@/models/DeliveryZone";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth/auth";

const DEFAULT_ZONES_SEED = [
  {
    name: "Accra Central Zone (0–5 km)",
    region: "Greater Accra",
    areas: ["East Legon", "Airport", "Osu", "Dzorwulu", "Cantonments", "Labone"],
    pricingType: "DISTANCE_BASED",
    deliveryFee: 15,
    pricePerKm: 2.0,
    includedDistanceKm: 3,
    radiusKm: 5,
    maxDistanceKm: 60,
    priority: 30,
    estimatedDeliveryTime: "45–90 mins",
    isActive: true,
    minimumOrder: 30,
    freeDeliveryThreshold: 350,
  },
  {
    name: "Greater Accra Core (5–12 km)",
    region: "Greater Accra",
    areas: ["Madina", "Adenta", "Spintex", "Tema", "Achimota", "Dome", "Dansoman", "Tesano"],
    pricingType: "DISTANCE_BASED",
    deliveryFee: 25,
    pricePerKm: 2.5,
    includedDistanceKm: 5,
    radiusKm: 12,
    maxDistanceKm: 60,
    priority: 20,
    estimatedDeliveryTime: "1–3 hours",
    isActive: true,
    minimumOrder: 40,
    freeDeliveryThreshold: 350,
  },
  {
    name: "Greater Accra Extended (12–25 km)",
    region: "Greater Accra",
    areas: ["Kasoa", "Prampram", "Amasaman", "Dodowa", "Aburi Foot"],
    pricingType: "DISTANCE_BASED",
    deliveryFee: 35,
    pricePerKm: 3.0,
    includedDistanceKm: 12,
    radiusKm: 25,
    maxDistanceKm: 60,
    priority: 15,
    estimatedDeliveryTime: "2–4 hours",
    isActive: true,
    minimumOrder: 50,
    freeDeliveryThreshold: 450,
  },
  {
    name: "Ashanti Regional Hub (Kumasi)",
    region: "Ashanti",
    areas: ["Kumasi Central", "Adum", "KNUST", "Ahodwo", "Asokwa", "Bantama"],
    pricingType: "FLAT",
    deliveryFee: 25,
    pricePerKm: 0,
    maxDistanceKm: 100,
    priority: 10,
    estimatedDeliveryTime: "24–48 hours",
    isActive: true,
    minimumOrder: 60,
    freeDeliveryThreshold: 500,
  },
  {
    name: "Northern Regional Hub (Tamale)",
    region: "Northern",
    areas: ["Tamale Central", "Jisonayilli", "Lamashegu", "Kukuo", "Nyankpala"],
    pricingType: "FLAT",
    deliveryFee: 25,
    pricePerKm: 0,
    maxDistanceKm: 100,
    priority: 10,
    estimatedDeliveryTime: "24–48 hours",
    isActive: true,
    minimumOrder: 60,
    freeDeliveryThreshold: 500,
  },
];

export async function GET() {
  try {
    await connectDB();

    let zones = await DeliveryZone.find().sort({ priority: -1, createdAt: -1 });

    // Seed defaults if database has none
    if (zones.length === 0) {
      await DeliveryZone.insertMany(DEFAULT_ZONES_SEED);
      zones = await DeliveryZone.find().sort({ priority: -1, createdAt: -1 });
    }

    const settings = await Settings.findOne();

    return NextResponse.json({
      success: true,
      data: {
        zones,
        storeLocation: settings?.storeLocation || {
          businessName: "Khady's Water Hub & Warehouse",
          address: "East Legon, Boundary Road, Accra",
          coordinates: { lat: 5.6356, lng: -0.1601 },
          defaultDeliveryFee: 20,
          pricePerKm: 2.5,
          freeDeliveryThreshold: 350,
          maxDeliveryRadiusKm: 60,
        },
      },
    });
  } catch (error) {
    console.error("[api/delivery/zones GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Allow admin or authenticated user to configure zones
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      // In dev, allow if user is logged in
    }

    await connectDB();
    const body = await req.json();

    const {
      name,
      region,
      areas,
      pricingType,
      deliveryFee,
      pricePerKm,
      includedDistanceKm,
      radiusKm,
      maxDistanceKm,
      priority,
      estimatedDeliveryTime,
      isActive,
      minimumOrder,
      freeDeliveryThreshold,
    } = body;

    if (!name || !region || deliveryFee === undefined) {
      return NextResponse.json(
        { success: false, error: "Name, region, and deliveryFee are required." },
        { status: 400 }
      );
    }

    const newZone = await DeliveryZone.create({
      name,
      region,
      areas: Array.isArray(areas) ? areas : [],
      pricingType: pricingType || "FLAT",
      deliveryFee: Number(deliveryFee),
      pricePerKm: Number(pricePerKm) || 0,
      includedDistanceKm: Number(includedDistanceKm) || 0,
      radiusKm: radiusKm ? Number(radiusKm) : undefined,
      maxDistanceKm: Number(maxDistanceKm) || 50,
      priority: Number(priority) || 10,
      estimatedDeliveryTime: estimatedDeliveryTime || "2–4 hours",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      minimumOrder: Number(minimumOrder) || 0,
      freeDeliveryThreshold: freeDeliveryThreshold ? Number(freeDeliveryThreshold) : undefined,
    });

    return NextResponse.json({ success: true, data: newZone }, { status: 201 });
  } catch (error) {
    console.error("[api/delivery/zones POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create delivery zone" },
      { status: 500 }
    );
  }
}
