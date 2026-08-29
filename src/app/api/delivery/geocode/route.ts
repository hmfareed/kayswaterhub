import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode, forwardGeocode } from "@/lib/delivery/geocoding";

/**
 * POST /api/delivery/geocode
 *
 * Two modes:
 * - Reverse geocode: { lat, lng }  → structured address
 * - Forward geocode: { query }      → list of matching places
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward geocode (address search)
    if (body.query) {
      const results = await forwardGeocode(body.query);
      return NextResponse.json({ success: true, data: results });
    }

    // Reverse geocode (GPS → address)
    if (body.lat != null && body.lng != null) {
      const lat = parseFloat(body.lat);
      const lng = parseFloat(body.lng);

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { success: false, error: "Invalid coordinates" },
          { status: 400 }
        );
      }

      const result = await reverseGeocode(lat, lng);

      if (!result) {
        return NextResponse.json(
          { success: false, error: "Could not determine address for these coordinates" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: "Provide either { lat, lng } or { query }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[api/delivery/geocode POST]", error);
    return NextResponse.json(
      { success: false, error: "Geocoding failed" },
      { status: 500 }
    );
  }
}
