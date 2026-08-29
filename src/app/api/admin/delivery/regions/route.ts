import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import DeliveryRegion, { GHANA_REGIONS_SEED } from "@/models/DeliveryRegion";

// GET /api/admin/delivery/regions — list all 16 regions (enabled + disabled)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const count = await DeliveryRegion.countDocuments();
    if (count === 0) {
      await DeliveryRegion.insertMany(GHANA_REGIONS_SEED);
    }

    const regions = await DeliveryRegion.find().sort({ name: 1 });
    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    console.error("[api/admin/delivery/regions GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch regions" }, { status: 500 });
  }
}

// POST /api/admin/delivery/regions — bulk upsert (re-seed / reset)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    // Accept single region create
    const { name, code, isEnabled, baseFee, estimatedDeliveryTime, quantityRules, notes } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "name and code are required" },
        { status: 400 }
      );
    }

    const region = await DeliveryRegion.findOneAndUpdate(
      { code: code.toUpperCase() },
      { name, code: code.toUpperCase(), isEnabled, baseFee, estimatedDeliveryTime, quantityRules, notes },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: region }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/delivery/regions POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create/update region" }, { status: 500 });
  }
}
