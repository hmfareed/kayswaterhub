import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import DeliveryZone from "@/models/DeliveryZone";
import { createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "@/services/admin/delivery.service";

export async function GET() {
  try {
    await connectDB();
    const zones = await DeliveryZone.find().sort({ priority: -1, name: 1 });
    return NextResponse.json({ success: true, data: zones });
  } catch (error: any) {
    console.error("[api/admin/delivery/zones GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch delivery zones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const zone = await createDeliveryZone(body);
    return NextResponse.json({ success: true, data: zone }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/delivery/zones POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create delivery zone" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    const zone = await updateDeliveryZone(id, data);
    return NextResponse.json({ success: true, data: zone });
  } catch (error: any) {
    console.error("[api/admin/delivery/zones PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update delivery zone" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    await deleteDeliveryZone(id);
    return NextResponse.json({ success: true, message: "Delivery zone deleted" });
  } catch (error: any) {
    console.error("[api/admin/delivery/zones DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete delivery zone" },
      { status: 500 }
    );
  }
}
