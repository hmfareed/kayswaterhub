import { NextRequest, NextResponse } from "next/server";
import { getAdminOrderById, updateOrderStatus, updateOrderCourierDetails } from "@/services/admin/order.service";

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

    // Check if updating courier details
    if (
      body.courierProvider !== undefined ||
      body.courierName !== undefined ||
      body.courierPhone !== undefined ||
      body.actualDeliveryFee !== undefined ||
      body.deliveryPaymentStatus !== undefined ||
      body.deliveryPaymentMethod !== undefined ||
      body.trackingReference !== undefined
    ) {
      const updatedOrder = await updateOrderCourierDetails(id, body);
      return NextResponse.json({ success: true, data: updatedOrder });
    }

    const { status, note } = body;
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status or courier details required" },
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
