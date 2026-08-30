import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/models/Settings";
import { updateStoreLocationSettings } from "@/services/admin/delivery.service";

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne();
    return NextResponse.json({
      success: true,
      data: settings?.storeLocation || {
        businessName: "Khady's Water Hub & Warehouse",
        address: "East Legon, Boundary Road, Accra",
        region: "Greater Accra",
        city: "Accra",
        coordinates: { lat: 5.6356, lng: -0.1601 },
        defaultDeliveryFee: 20,
        pricePerKm: 2.5,
        freeDeliveryThreshold: 350,
        freeDeliveryEnabled: true,
        maxDeliveryRadiusKm: 60,
      },
    });
  } catch (error: any) {
    console.error("[api/admin/delivery/store-location GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch store location" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateStoreLocationSettings(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[api/admin/delivery/store-location PUT]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update store location" },
      { status: 500 }
    );
  }
}
