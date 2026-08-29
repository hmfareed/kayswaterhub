import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import DeliveryRegion from "@/models/DeliveryRegion";

// PATCH /api/admin/delivery/regions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const updated = await DeliveryRegion.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/delivery/regions/[id] PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update region" }, { status: 500 });
  }
}

// GET /api/admin/delivery/regions/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const region = await DeliveryRegion.findById(id);

    if (!region) {
      return NextResponse.json({ success: false, error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: region });
  } catch (error) {
    console.error("[api/admin/delivery/regions/[id] GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch region" }, { status: 500 });
  }
}
