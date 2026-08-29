import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import DeliveryException from "@/models/DeliveryException";

// PATCH /api/admin/delivery/exceptions/[id]
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
    const updated = await DeliveryException.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Exception not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[api/admin/delivery/exceptions/[id] PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update exception" }, { status: 500 });
  }
}

// DELETE /api/admin/delivery/exceptions/[id]
export async function DELETE(
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

    const deleted = await DeliveryException.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Exception not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Exception deleted" });
  } catch (error) {
    console.error("[api/admin/delivery/exceptions/[id] DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete exception" }, { status: 500 });
  }
}
