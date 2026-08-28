import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/Order";
import { paymentService } from "@/services/payment/PaymentService";
import { OrderService } from "@/services/order/OrderService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference") || searchParams.get("ref");

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Payment reference is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    // If already verified via webhook
    if (payment.status === "SUCCESS") {
      const order = await Order.findById(payment.orderId);
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        orderId: payment.orderId,
        order,
        payment,
      });
    }

    // Otherwise verify with Paystack directly
    const verification = await paymentService.verifyPayment(reference);

    if (verification.success) {
      payment.status = "SUCCESS";
      payment.transactionId = verification.transactionId;
      payment.paidAt = verification.paidAt;
      payment.transactions.push({
        event: "verification.success",
        data: verification as unknown as Record<string, unknown>,
        receivedAt: new Date(),
      });
      await payment.save();

      await OrderService.confirmPayment(
        payment.orderId.toString(),
        payment._id.toString()
      );

      const order = await Order.findById(payment.orderId);
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        orderId: payment.orderId,
        order,
        payment,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: payment.status,
        orderId: payment.orderId,
        error: verification.error || "Payment verification pending or unsuccessful",
      });
    }
  } catch (error) {
    console.error("[api/payments/verify GET]", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
