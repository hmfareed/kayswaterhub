import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderById, updateOrderStatus } from "@/services/admin/order.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getAdminOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("[api/admin/orders/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus(id, status, note);
    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error("[api/admin/orders/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
