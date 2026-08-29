import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import DeliveryException from "@/models/DeliveryException";

// GET /api/admin/delivery/exceptions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const exceptions = await DeliveryException.find().sort({ priority: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: exceptions });
  } catch (error) {
    console.error("[api/admin/delivery/exceptions GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch exceptions" }, { status: 500 });
  }
}

// POST /api/admin/delivery/exceptions
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { name, areas, fee, priority, isActive, notes } = body;

    if (!name || fee === undefined) {
      return NextResponse.json(
        { success: false, error: "name and fee are required" },
        { status: 400 }
      );
    }

    const exc = await DeliveryException.create({
      name,
      areas: Array.isArray(areas) ? areas : [],
      fee: Number(fee),
      priority: Number(priority) || 50,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes,
    });

    return NextResponse.json({ success: true, data: exc }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/delivery/exceptions POST]", error);
    return NextResponse.json({ success: false, error: "Failed to create exception" }, { status: 500 });
  }
}
