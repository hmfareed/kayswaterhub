import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { processAdminRefund } from "@/services/admin/payment.service";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const refundOrders = await Order.find({
      $or: [
        { status: "REFUND_PENDING" },
        { status: "REFUNDED" },
        { "refund.status": { $ne: "NOT_REQUIRED" } },
      ],
    })
      .populate("customerId", "name email phone")
      .populate("paymentId")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: refundOrders });
  } catch (error: any) {
    console.error("[api/admin/refunds GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, reason } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "orderId and amount are required" },
        { status: 400 }
      );
    }

    const order = await processAdminRefund({
      orderId,
      amount: parseFloat(amount),
      reason,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("[api/admin/refunds POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
