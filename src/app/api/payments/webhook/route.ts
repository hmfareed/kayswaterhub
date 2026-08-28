import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/Order";
import { paymentService } from "@/services/payment/PaymentService";
import { OrderService } from "@/services/order/OrderService";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    // 1. Verify Webhook Signature
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Paystack Webhook] Invalid signature rejected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Paystack Webhook] Received event: ${event}`);

    await connectDB();

    // 2. Process charge.success
    if (event === "charge.success") {
      const reference = data.reference;
      if (!reference) {
        return NextResponse.json({ error: "No reference provided" }, { status: 400 });
      }

      const payment = await Payment.findOne({ reference });
      if (!payment) {
        console.warn(`[Paystack Webhook] Payment reference not found: ${reference}`);
        return NextResponse.json({ received: true });
      }

      // Idempotency check
      if (payment.status === "SUCCESS") {
        console.log(`[Paystack Webhook] Reference already processed: ${reference}`);
        return NextResponse.json({ received: true, message: "Already processed" });
      }

      const amountPaid = (data.amount || 0) / 100;
      if (amountPaid < payment.amount) {
        console.error(
          `[Paystack Webhook] Amount mismatch: Paid ${amountPaid}, expected ${payment.amount}`
        );
      }

      payment.status = "SUCCESS";
      payment.transactionId = String(data.id || data.reference);
      payment.paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
      payment.transactions.push({
        event: "charge.success",
        data,
        receivedAt: new Date(),
      });

      await payment.save();

      // Confirm Order & Finalize Inventory & Dispatch Delivery
      await OrderService.confirmPayment(
        payment.orderId.toString(),
        payment._id.toString()
      );

      console.log(`[Paystack Webhook] Order ${payment.orderId} marked as PAID.`);
      return NextResponse.json({ received: true, status: "Order confirmed" });
    }

    // 3. Process charge.failed
    if (event === "charge.failed") {
      const reference = data.reference;
      if (reference) {
        const payment = await Payment.findOne({ reference });
        if (payment && payment.status !== "SUCCESS") {
          payment.status = "FAILED";
          payment.transactions.push({
            event: "charge.failed",
            data,
            receivedAt: new Date(),
          });
          await payment.save();

          await OrderService.handlePaymentFailure(payment.orderId.toString());
          console.log(`[Paystack Webhook] Payment failed for order ${payment.orderId}.`);
        }
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paystack Webhook] Unhandled error:", error);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}
