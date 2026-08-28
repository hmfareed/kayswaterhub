import { connectDB } from "@/lib/db/mongoose";
import Order, { IOrder } from "@/models/Order";
import ProductVariant from "@/models/ProductVariant";
import InventoryTransaction from "@/models/InventoryTransaction";
import { logAdminAction } from "./audit.service";
import { notificationService } from "@/services/notification/NotificationService";
import type { NotificationEvent } from "@/types";
import mongoose from "mongoose";

export interface GetOrdersParams {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getAdminOrders(params: GetOrdersParams) {
  await connectDB();

  const {
    status,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const query: Record<string, unknown> = {};

  if (status && status !== "all") {
    query.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    query.$or = [
      { orderNumber: searchRegex },
      { "guestInformation.name": searchRegex },
      { "guestInformation.phone": searchRegex },
      { "guestInformation.email": searchRegex },
      { "deliveryAddress.city": searchRegex },
      { "deliveryAddress.area": searchRegex },
      { "deliveryAddress.region": searchRegex },
    ];
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) (query.createdAt as any).$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      (query.createdAt as any).$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("customerId", "name email phone")
      .populate("paymentId")
      .populate("deliveryId")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminOrderById(orderIdOrNumber: string) {
  await connectDB();

  let query: any = { orderNumber: orderIdOrNumber };
  if (mongoose.Types.ObjectId.isValid(orderIdOrNumber)) {
    query = { $or: [{ _id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }] };
  }

  const order = await Order.findOne(query)
    .populate("customerId", "name email phone avatar")
    .populate("paymentId")
    .populate("deliveryId");

  return order;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string,
  adminUser?: { id: string; name: string }
) {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const prevStatus = order.status;
  order.status = newStatus as any;

  // Add timeline entry
  const timelineTitle = getTimelineTitleForStatus(newStatus);
  order.timeline.push({
    status: newStatus,
    title: timelineTitle,
    description: note || `Order status updated to ${newStatus.replace(/_/g, " ")} by ${adminUser?.name || "Admin"}`,
    actor: adminUser?.name ? `ADMIN (${adminUser.name})` : "ADMIN",
    timestamp: new Date(),
  });

  // If transitioning to PAID or PROCESSING and wasn't already deducted, adjust stock
  if (
    (newStatus === "PAID" || newStatus === "PROCESSING") &&
    prevStatus === "PENDING_PAYMENT"
  ) {
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId);
        if (variant) {
          const prevStock = variant.stockQuantity;
          variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
          await variant.save();

          await InventoryTransaction.create({
            variantId: variant._id,
            productId: variant.productId,
            type: "SALE",
            quantityChange: -item.quantity,
            previousStock: prevStock,
            newStock: variant.stockQuantity,
            reason: `Order sale #${order.orderNumber}`,
            referenceId: order._id,
            performedBy: adminUser?.id,
          });
        }
      }
    }
  }

  // If cancelled from a paid state, restore inventory
  if (newStatus === "CANCELLED" && (prevStatus === "PAID" || prevStatus === "PROCESSING" || prevStatus === "CONFIRMED")) {
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId);
        if (variant) {
          const prevStock = variant.stockQuantity;
          variant.stockQuantity += item.quantity;
          await variant.save();

          await InventoryTransaction.create({
            variantId: variant._id,
            productId: variant.productId,
            type: "CANCELLED_ORDER",
            quantityChange: item.quantity,
            previousStock: prevStock,
            newStock: variant.stockQuantity,
            reason: `Order cancellation restore #${order.orderNumber}`,
            referenceId: order._id,
            performedBy: adminUser?.id,
          });
        }
      }
    }
  }

  await order.save();

  // Audit log
  await logAdminAction({
    performedBy: adminUser?.id,
    action: "ORDER_STATUS_UPDATED",
    resource: "Order",
    resourceId: order._id.toString(),
    description: `Order #${order.orderNumber} status changed from ${prevStatus} to ${newStatus}`,
    changes: [{ field: "status", before: prevStatus, after: newStatus }],
  });

  // Emit event-driven customer notification
  try {
    const eventMapping: Record<string, NotificationEvent> = {
      CONFIRMED: "ORDER_CONFIRMED",
      PROCESSING: "ORDER_PROCESSING",
      READY_FOR_DELIVERY: "ORDER_PROCESSING",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
      CANCELLED: "ORDER_CANCELLED",
      REFUND_PENDING: "REFUND_INITIATED",
      REFUNDED: "REFUND_PROCESSED",
    };

    const notifEvent = eventMapping[newStatus];
    if (notifEvent) {
      await notificationService.notifyCustomerOrderEvent(
        {
          _id: order._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          guestInformation: order.guestInformation,
          total: order.total,
        },
        notifEvent,
        undefined,
        note
      );
    }
  } catch (err) {
    console.error("[updateOrderStatus] Error creating customer notification:", err);
  }

  return order;
}

function getTimelineTitleForStatus(status: string): string {
  switch (status) {
    case "PAID":
      return "Payment Confirmed";
    case "CONFIRMED":
      return "Order Confirmed by Admin";
    case "PROCESSING":
      return "Order Being Packaged & Prepared";
    case "READY_FOR_DELIVERY":
      return "Ready for Dispatch / Driver Pickup";
    case "OUT_FOR_DELIVERY":
      return "Dispatched & Out for Delivery";
    case "DELIVERED":
      return "Package Delivered Successfully";
    case "CANCELLED":
      return "Order Cancelled";
    case "REFUND_PENDING":
      return "Refund Requested / Processing";
    case "REFUNDED":
      return "Payment Refunded to Customer";
    default:
      return `Status changed to ${status}`;
  }
}
