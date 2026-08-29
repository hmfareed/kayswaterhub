import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    let query: Record<string, unknown> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      const cleanNum = id.replace(/^#/, "");
      query = { orderNumber: { $regex: cleanNum, $options: "i" } };
    }

    const order = await Order.findOne(query)
      .populate("paymentId")
      .populate("deliveryId");

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Security: non-admin users can only view their own orders
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin && String(order.customerId) !== String(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

    if (isAdmin) {
      // Admins can update any field freely
      if (status) order.status = status;
      if (notes !== undefined) order.notes = notes;
    } else {
      // Customers: can only cancel their own orders
      if (String(order.customerId) !== String(session.user.id)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      // Only allow cancellation
      const requestedStatus = (status || "").toUpperCase();
      if (requestedStatus !== "CANCELLED") {
        return NextResponse.json(
          { success: false, error: "You can only cancel orders." },
          { status: 403 }
        );
      }

      // Cannot cancel if already out for delivery or delivered
      const nonCancellableStatuses = ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
      if (nonCancellableStatuses.includes((order.status || "").toUpperCase())) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This order can no longer be cancelled. It is already out for delivery or delivered.",
          },
          { status: 400 }
        );
      }

      order.status = "CANCELLED";
    }

    await order.save();

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[api/orders/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
