import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import DeliveryRegion, { GHANA_REGIONS_SEED } from "@/models/DeliveryRegion";

/**
 * GET /api/delivery/regions
 * Public endpoint — returns enabled regions for the manual address form.
 */
export async function GET() {
  try {
    await connectDB();

    let regions = await DeliveryRegion.find({ isEnabled: true }).sort({ name: 1 });

    // Auto-seed if empty
    if ((await DeliveryRegion.countDocuments()) === 0) {
      await DeliveryRegion.insertMany(GHANA_REGIONS_SEED);
      regions = await DeliveryRegion.find({ isEnabled: true }).sort({ name: 1 });
    }

    return NextResponse.json({
      success: true,
      data: regions.map((r) => ({
        name: r.name,
        code: r.code,
        baseFee: r.baseFee,
        estimatedDeliveryTime: r.estimatedDeliveryTime,
        quantityRules: r.quantityRules,
      })),
    });
  } catch (error) {
    console.error("[api/delivery/regions GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
