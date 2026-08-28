import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/Order";
import { logAdminAction } from "./audit.service";
import mongoose from "mongoose";

export async function getAdminPayments(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const { status, search, page = 1, limit = 20 } = params;
  const query: Record<string, unknown> = {};

  if (status && status !== "all") {
    query.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    query.reference = { $regex: search.trim(), $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate("orderId", "orderNumber total status guestInformation customerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  // Overall stats
  const allPayments = await Payment.find();
  const successfulTotal = allPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingTotal = allPayments
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const failedTotal = allPayments
    .filter((p) => p.status === "FAILED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const refundedTotal = allPayments
    .filter((p) => p.status === "REFUNDED")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    stats: {
      successfulTotal: Math.round(successfulTotal * 100) / 100,
      pendingTotal: Math.round(pendingTotal * 100) / 100,
      failedTotal: Math.round(failedTotal * 100) / 100,
      refundedTotal: Math.round(refundedTotal * 100) / 100,
    },
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function processAdminRefund(data: {
  orderId: string;
  amount: number;
  reason?: string;
  adminId?: string;
}) {
  await connectDB();

  const order = await Order.findById(data.orderId);
  if (!order) throw new Error("Order not found");

  const refundRef = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  order.status = "REFUNDED";
  order.refund = {
    status: "COMPLETED",
    amount: data.amount,
    reason: data.reason || "Admin processed refund via Paystack",
    reference: refundRef,
    processedAt: new Date(),
  };

  order.timeline.push({
    status: "REFUNDED",
    title: "Refund Completed",
    description: `Refund of GH₵${data.amount.toFixed(2)} processed (${data.reason || "General refund"})`,
    actor: "ADMIN",
    timestamp: new Date(),
  });

  await order.save();

  if (order.paymentId) {
    await Payment.findByIdAndUpdate(order.paymentId, {
      $set: { status: "REFUNDED" },
      $push: {
        transactions: {
          event: "refund.processed",
          data: { amount: data.amount, reference: refundRef, reason: data.reason },
          receivedAt: new Date(),
        },
      },
    });
  }

  await logAdminAction({
    performedBy: data.adminId,
    action: "REFUND_PROCESSED",
    resource: "Order",
    resourceId: order._id.toString(),
    description: `Processed refund of GH₵${data.amount} for Order #${order.orderNumber}`,
  });

  return order;
}
