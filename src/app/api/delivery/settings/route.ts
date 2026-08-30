import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json({
      success: true,
      data: settings.storeLocation,
    });
  } catch (error) {
    console.error("[api/delivery/settings GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to get store delivery settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      businessName,
      address,
      region,
      city,
      coordinates,
      defaultDeliveryFee,
      pricePerKm,
      freeDeliveryThreshold,
      freeDeliveryEnabled,
      maxDeliveryRadiusKm,
    } = body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const isFreeEnabled =
      freeDeliveryEnabled !== undefined
        ? Boolean(freeDeliveryEnabled)
        : freeDeliveryThreshold !== null &&
          freeDeliveryThreshold !== undefined &&
          Number(freeDeliveryThreshold) > 0;

    let parsedThreshold: number | null = null;
    if (isFreeEnabled && freeDeliveryThreshold !== null && freeDeliveryThreshold !== undefined && freeDeliveryThreshold !== "") {
      const parsed = Number(freeDeliveryThreshold);
      parsedThreshold = !isNaN(parsed) && parsed > 0 ? parsed : null;
    }

    settings.storeLocation = {
      businessName: businessName || settings.storeLocation?.businessName || "Khady's Water Hub",
      address: address || settings.storeLocation?.address || "East Legon, Accra",
      region: region || settings.storeLocation?.region || "Greater Accra",
      city: city || settings.storeLocation?.city || "Accra",
      coordinates: {
        lat: coordinates?.lat !== undefined ? Number(coordinates.lat) : 5.6356,
        lng: coordinates?.lng !== undefined ? Number(coordinates.lng) : -0.1601,
      },
      defaultDeliveryFee: defaultDeliveryFee !== undefined ? Number(defaultDeliveryFee) : 20,
      pricePerKm: pricePerKm !== undefined ? Number(pricePerKm) : 2.5,
      freeDeliveryThreshold: parsedThreshold,
      freeDeliveryEnabled: isFreeEnabled,
      maxDeliveryRadiusKm: maxDeliveryRadiusKm !== undefined ? Number(maxDeliveryRadiusKm) : 60,
    };

    settings.markModified("storeLocation");
    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings.storeLocation,
    });
  } catch (error) {
    console.error("[api/delivery/settings PUT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update store delivery settings" },
      { status: 500 }
    );
  }
}
