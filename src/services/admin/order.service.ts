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
    const s = status.toLowerCase();
    if (s === "pending" || s === "pending_payment") {
      query.status = { $in: ["PENDING_PAYMENT", "PENDING"] };
    } else if (s === "paid" || s === "confirmed") {
      query.status = { $in: ["PAID", "CONFIRMED"] };
    } else if (s === "processing") {
      query.status = "PROCESSING";
    } else if (s === "ready" || s === "ready_for_delivery") {
      query.status = { $in: ["READY_FOR_DELIVERY", "READY"] };
    } else if (s === "out_for_delivery" || s === "in_transit") {
      query.status = { $in: ["OUT_FOR_DELIVERY", "IN_TRANSIT"] };
    } else if (s === "delivered") {
      query.status = { $in: ["DELIVERED", "COMPLETED"] };
    } else if (s === "cancelled") {
      query.status = { $in: ["CANCELLED", "FAILED_DELIVERY"] };
    } else if (s === "refunded" || s === "refund_pending") {
      query.status = { $in: ["REFUND_PENDING", "REFUNDED"] };
    } else {
      query.status = status.toUpperCase();
    }
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

  const clean = (orderIdOrNumber || "").trim().replace(/^#/, "");
  let query: any = { orderNumber: { $regex: new RegExp(`^#?${clean}$`, "i") } };

  if (mongoose.Types.ObjectId.isValid(orderIdOrNumber)) {
    query = {
      $or: [
        { _id: new mongoose.Types.ObjectId(orderIdOrNumber) },
        { orderNumber: { $regex: new RegExp(`^#?${clean}$`, "i") } },
      ],
    };
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

export async function updateOrderCourierDetails(
  orderId: string,
  data: {
    courierProvider?: string;
    courierName?: string;
    courierPhone?: string;
    actualDeliveryFee?: number;
    deliveryPaymentStatus?: string;
    deliveryPaymentMethod?: string;
    trackingReference?: string;
    deliveryStatus?: string;
  },
  adminUser?: { id: string; name: string }
) {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (data.courierProvider !== undefined) order.courierProvider = data.courierProvider as any;
  if (data.courierName !== undefined) order.courierName = data.courierName;
  if (data.courierPhone !== undefined) order.courierPhone = data.courierPhone;
  if (data.actualDeliveryFee !== undefined) order.actualDeliveryFee = data.actualDeliveryFee;
  if (data.deliveryPaymentStatus !== undefined) order.deliveryPaymentStatus = data.deliveryPaymentStatus as any;
  if (data.deliveryPaymentMethod !== undefined) order.deliveryPaymentMethod = data.deliveryPaymentMethod as any;
  if (data.trackingReference !== undefined) order.trackingReference = data.trackingReference;

  // Add timeline note
  order.timeline.push({
    status: order.status,
    title: "Courier & Delivery Details Updated",
    description: `Courier details updated: Provider=${order.courierProvider || "N/A"}, Fee=GH₵${order.actualDeliveryFee || order.estimatedDeliveryFee || 0}, DeliveryPaymentStatus=${order.deliveryPaymentStatus || "EXPECTED"}`,
    actor: adminUser?.name ? `ADMIN (${adminUser.name})` : "ADMIN",
    timestamp: new Date(),
  });

  await order.save();

  // If order has a linked DeliveryOrder, keep it synced
  if (order.deliveryId) {
    try {
      const DeliveryOrder = mongoose.models.DeliveryOrder;
      if (DeliveryOrder) {
        const updatePayload: Record<string, unknown> = {};
        if (data.courierProvider) updatePayload.provider = data.courierProvider;
        if (data.courierName || data.courierPhone) {
          updatePayload.assignedRider = {
            name: data.courierName || order.courierName,
            phone: data.courierPhone || order.courierPhone,
          };
        }
        if (data.actualDeliveryFee !== undefined) updatePayload.actualFee = data.actualDeliveryFee;
        if (data.deliveryPaymentStatus) updatePayload.deliveryPaymentStatus = data.deliveryPaymentStatus;
        if (data.trackingReference) updatePayload.trackingReference = data.trackingReference;
        if (data.deliveryStatus) updatePayload.status = data.deliveryStatus;

        await DeliveryOrder.findByIdAndUpdate(order.deliveryId, { $set: updatePayload });
      }
    } catch (deliveryErr) {
      console.warn("[updateOrderCourierDetails] Error syncing DeliveryOrder:", deliveryErr);
    }
  }

  // Audit log
  await logAdminAction({
    performedBy: adminUser?.id,
    action: "ORDER_COURIER_UPDATED",
    resource: "Order",
    resourceId: order._id.toString(),
    description: `Order #${order.orderNumber} courier & delivery details updated`,
    changes: [{ field: "courierDetails", before: null, after: data }],
  });

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
