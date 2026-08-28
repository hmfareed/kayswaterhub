import { NextRequest, NextResponse } from "next/server";
import { resolveDeliveryFee } from "@/lib/delivery/delivery-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coordinates, region, city, area, subtotal } = body;

    const result = await resolveDeliveryFee({
      coordinates: coordinates
        ? {
            lat: parseFloat(coordinates.lat),
            lng: parseFloat(coordinates.lng),
          }
        : undefined,
      region,
      city,
      area,
      subtotal: typeof subtotal === "number" ? subtotal : parseFloat(subtotal) || 0,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[api/delivery/calculate POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate delivery fee",
      },
      { status: 500 }
    );
  }
}
