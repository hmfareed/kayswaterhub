import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import DeliveryOrder from "@/models/DeliveryOrder";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    await connectDB();

    let query: Record<string, unknown> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      // Clean order number (e.g. WH-2405258 or ORD-20260827-001)
      const cleanNum = id.replace(/^#/, "");
      query = { orderNumber: { $regex: cleanNum, $options: "i" } };
    }

    const order = await Order.findOne(query)
      .populate("paymentId")
      .populate("deliveryId");

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[api/orders/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order details" },
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
    const { status, notes } = body;

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[api/orders/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
