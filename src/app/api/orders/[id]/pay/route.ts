import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import { paymentService } from "@/services/payment/PaymentService";
import { InventoryService } from "@/services/inventory/InventoryService";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    let query: Record<string, unknown> = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { orderNumber: id }] };
    } else {
      const cleanNum = id.replace(/^#/, "");
      query = { orderNumber: { $regex: `^${cleanNum}$`, $options: "i" } };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // 1. Authorization check
    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    if (!isAdmin) {
      let isOwner = false;

      if (order.customerId) {
        isOwner = !!(
          session?.user?.id && String(order.customerId) === String(session.user.id)
        );
      } else {
        const userEmail = session?.user?.email?.trim();
        const hasValidEmail =
          userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com");
        const userPhone = session?.user?.phone?.trim()?.replace(/[\s-]/g, "");
        const orderPhone = order.guestInformation?.phone?.trim()?.replace(/[\s-]/g, "");

        const emailMatches = Boolean(
          hasValidEmail &&
            order.guestInformation?.email?.toLowerCase() === userEmail.toLowerCase()
        );
        const phoneMatches = Boolean(
          userPhone &&
            userPhone.length >= 9 &&
            orderPhone &&
            (userPhone === orderPhone || userPhone.slice(-9) === orderPhone.slice(-9))
        );

        isOwner = emailMatches || phoneMatches;
      }

      // If user is unauthenticated or not direct owner, allow if accessing directly by exact order ID/orderNumber
      if (!isOwner && session?.user && order.customerId) {
        return NextResponse.json(
          { success: false, error: "You are not authorized to pay for this order." },
          { status: 403 }
        );
      }
    }

    // 2. Validate Order Status
    const rawStatus = (order.status || "").toUpperCase();

    if (
      rawStatus === "PAID" ||
      rawStatus === "CONFIRMED" ||
      rawStatus === "PROCESSING" ||
      rawStatus === "OUT_FOR_DELIVERY" ||
      rawStatus === "DELIVERED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This order has already been paid.",
          isAlreadyPaid: true,
          orderNumber: order.orderNumber,
        },
        { status: 400 }
      );
    }

    if (rawStatus === "CANCELLED" || rawStatus === "FAILED_DELIVERY") {
      return NextResponse.json(
        {
          success: false,
          error: "This order has been cancelled and cannot be paid. Please place a new order.",
          isCancelled: true,
        },
        { status: 400 }
      );
    }

    if (rawStatus !== "PENDING_PAYMENT" && rawStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Order is in '${order.status}' status and cannot accept payment.`,
        },
        { status: 400 }
      );
    }

    // 3. Ensure stock reservations are still active
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.variantId) {
          await InventoryService.reserve(
            item.variantId.toString(),
            order._id.toString(),
            item.quantity
          );
        }
      }
    }

    // 4. Generate new Paystack reference
    const reference = `PSK_${order.orderNumber}_${Date.now()}`;
    const onlineTotal = Number(order.total) || 0;

    if (onlineTotal <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid order amount for online payment." },
        { status: 400 }
      );
    }

    // 5. Create Payment record in MongoDB
    const payment = await Payment.create({
      orderId: order._id,
      provider: "PAYSTACK",
      reference,
      amount: onlineTotal,
      currency: "GHS",
      method: "MOBILE_MONEY",
      status: "PENDING",
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId?.toString() || session?.user?.id || "guest",
        deliveryZone: order.deliveryAddress?.zoneName,
        deliveryMethod: order.deliveryMethod,
        isReinitiated: true,
      },
      transactions: [],
    });

    order.paymentId = payment._id;
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: "PENDING_PAYMENT",
      title: "Payment Re-initiated",
      description: `Payment checkout session re-generated (${reference})`,
      actor: isAdmin ? "ADMIN" : "CUSTOMER",
      timestamp: new Date(),
    });

    await order.save();

    // 6. Initialize Paystack Transaction
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const callbackUrl = `${protocol}://${host}/orders/${order._id}?ref=${reference}`;

    const customerEmail =
      order.guestInformation?.email ||
      session?.user?.email ||
      `customer-${order.orderNumber}@khadyswater.com`;
    const customerPhone =
      order.deliveryAddress?.phone ||
      order.guestInformation?.phone ||
      session?.user?.phone ||
      "";

    const paymentInitResult = await paymentService.initiatePayment({
      reference,
      amount: onlineTotal,
      email: customerEmail,
      phone: customerPhone,
      callbackUrl,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId?.toString() || session?.user?.id,
        isReinitiated: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reference,
        total: onlineTotal,
        authorizationUrl: paymentInitResult.authorizationUrl,
        accessCode: paymentInitResult.accessCode,
        isSimulated: paymentInitResult.isSimulated,
      },
    });
  } catch (error) {
    console.error("[api/orders/[id]/pay POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to initiate payment.",
      },
      { status: 500 }
    );
  }
}
