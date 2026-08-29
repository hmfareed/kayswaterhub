import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import DeliveryOrder from "@/models/DeliveryOrder";
import Settings from "@/models/Settings";
import { InventoryService } from "@/services/inventory/InventoryService";
import { notificationService } from "@/services/notification/NotificationService";
import { generateOrderNumber } from "@/lib/utils";
import type { OrderStatus, PaymentMethod, DeliveryMethod, DeliveryPaymentStatus, DeliveryPaymentMethod } from "@/types";
import type { IOrderItem, IDeliveryAddress, IGuestInformation } from "@/models/Order";

export interface CreateOrderPayload {
  customerId?: string;
  guestInformation?: IGuestInformation;
  items: IOrderItem[];
  subtotal: number;
  discount?: number;
  deliveryFee?: number; // Estimated fee
  estimatedDeliveryFee?: number;
  total: number; // Online product payment amount (subtotal - discount)
  amountPaidOnline?: number;
  deliveryMethod?: DeliveryMethod;
  deliveryPaymentStatus?: DeliveryPaymentStatus;
  deliveryPaymentMethod?: DeliveryPaymentMethod;
  paymentMethod?: string;
  deliveryAddress: IDeliveryAddress;
}

/**
 * OrderService — coordinates the full order lifecycle.
 *
 * Architecture rules enforced:
 * - Product payment is separate from courier delivery payment.
 * - Website collects product payment via Paystack.
 * - Courier collects delivery fee on delivery/pickup.
 * - Rule 3: Reserves stock before payment, not on cart add
 * - Rule 4: Price snapshots stored in OrderItem, never recalculated
 * - Rule 10: Every transition is logged and creates linked delivery orders
 */
export class OrderService {
  /**
   * Create a new pending order and reserve stock for all items.
   * Called at checkout BEFORE payment is initiated.
   */
  static async createPendingOrder(
    payload: CreateOrderPayload
  ): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
    await connectDB();

    const orderNumber = generateOrderNumber();
    const estFee = payload.estimatedDeliveryFee ?? payload.deliveryFee ?? 0;
    const deliveryMethod = payload.deliveryMethod || "YANGO_DOOR";
    const deliveryPaymentStatus =
      payload.deliveryPaymentStatus ||
      (deliveryMethod === "SELF_PICKUP" ? "NOT_REQUIRED" : "EXPECTED");

    const order = await Order.create({
      orderNumber,
      customerId: payload.customerId,
      guestInformation: payload.guestInformation,
      items: payload.items,
      subtotal: payload.subtotal,
      discount: payload.discount ?? 0,
      total: payload.total, // Online product payment
      amountPaidOnline: 0,
      deliveryFee: estFee,
      estimatedDeliveryFee: estFee,
      deliveryMethod,
      deliveryPaymentStatus,
      deliveryPaymentMethod: payload.deliveryPaymentMethod || "CASH_TO_COURIER",
      paymentMethod: payload.paymentMethod || "PAYSTACK",
      deliveryAddress: payload.deliveryAddress,
      status: "PENDING_PAYMENT",
    });

    // Reserve stock for all items
    for (const item of payload.items) {
      if (item.variantId) {
        const result = await InventoryService.reserve(
          item.variantId.toString(),
          order._id.toString(),
          item.quantity
        );

        if (!result.success) {
          // If any reservation fails, cancel the order and release prior reservations
          await Order.findByIdAndUpdate(order._id, { status: "CANCELLED" });
          for (const prev of payload.items) {
            if (prev.variantId.toString() === item.variantId.toString()) break;
            await InventoryService.release(
              prev.variantId.toString(),
              order._id.toString()
            );
          }
          return { success: false, error: result.error };
        }
      }
    }

    // Notify Customer and Admin about new order placement
    try {
      await notificationService.notifyCustomerOrderEvent(
        {
          _id: order._id,
          orderNumber,
          customerId: payload.customerId,
          guestInformation: payload.guestInformation,
          total: payload.total,
        },
        "ORDER_PLACED"
      );

      await notificationService.notifyAdminEvent({
        event: "NEW_ORDER",
        category: "ORDERS",
        priority: "HIGH",
        title: `New Order Placed: #${orderNumber}`,
        message: `Order #${orderNumber} for GH₵${payload.total.toFixed(2)} (Products) placed by ${payload.guestInformation?.name || "Customer"}. Delivery: ${deliveryMethod.replace(/_/g, " ")}.`,
        entityType: "ORDER",
        entityId: orderNumber,
        actionUrl: `/admin/orders/${orderNumber}`,
        actionLabel: "View Order",
        metadata: { orderId: order._id.toString(), orderNumber, total: payload.total },
      });
    } catch (notifErr) {
      console.error("[OrderService] Notification error on createPendingOrder:", notifErr);
    }

    return {
      success: true,
      orderId: order._id.toString(),
      orderNumber,
    };
  }

  /**
   * Called after successful payment webhook verification.
   * Finalizes stock, creates DeliveryOrder dispatch record, and moves order to PAID.
   */
  static async confirmPayment(
    orderId: string,
    paymentId: string
  ): Promise<void> {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "PENDING_PAYMENT") return; // idempotent

    order.paymentId = paymentId as unknown as typeof order.paymentId;
    order.status = "PAID";
    order.amountPaidOnline = order.total;

    // Auto-create DeliveryOrder record
    try {
      const settings = await Settings.findOne();
      const pickupAddress =
        settings?.storeLocation?.address ||
        "Khady's Water Hub, East Legon, Boundary Road, Accra";

      const destinationAddress = [
        order.deliveryAddress.houseOrBuilding,
        order.deliveryAddress.parcelStation ? `Station: ${order.deliveryAddress.parcelStation}` : null,
        order.deliveryAddress.area,
        order.deliveryAddress.city,
        order.deliveryAddress.region,
        order.deliveryAddress.digitalAddress,
      ]
        .filter(Boolean)
        .join(", ");

      const provider =
        order.deliveryMethod === "YANGO_DOOR"
          ? "YANGO"
          : order.deliveryMethod === "NATIONWIDE_PARCEL"
          ? "STATION_COURIER"
          : "INTERNAL";

      const initialStatus =
        order.deliveryMethod === "SELF_PICKUP"
          ? "PICKUP_PENDING"
          : "AWAITING_COURIER";

      const deliveryOrder = await DeliveryOrder.create({
        orderId: order._id,
        method: order.deliveryMethod || "YANGO_DOOR",
        provider,
        pickupAddress,
        destinationAddress: destinationAddress || `${order.deliveryAddress.city}, ${order.deliveryAddress.region}`,
        destinationCoordinates: order.deliveryAddress.coordinates,
        parcelStation: order.deliveryAddress.parcelStation,
        deliveryFee: order.estimatedDeliveryFee || order.deliveryFee || 0,
        estimatedFee: order.estimatedDeliveryFee || order.deliveryFee || 0,
        deliveryPaymentStatus: order.deliveryPaymentStatus || "EXPECTED",
        status: initialStatus,
      });

      order.deliveryId = deliveryOrder._id;
    } catch (err) {
      console.error("[OrderService.confirmPayment] Error creating delivery record:", err);
    }

    await order.save();

    // Finalize stock for all items
    for (const item of order.items) {
      if (item.variantId) {
        await InventoryService.finalizeSale(
          item.variantId.toString(),
          orderId,
          item.quantity
        );
      }
    }

    // Notify Customer & Admin about successful payment
    try {
      await notificationService.notifyPaymentEvent({
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          guestInformation: order.guestInformation,
          total: order.total,
        },
        paymentMethod: order.paymentMethod,
        isSuccess: true,
      });
    } catch (err) {
      console.error("[OrderService.confirmPayment] Error sending payment notifications:", err);
    }
  }

  /**
   * Called when payment fails. Releases reserved stock.
   */
  static async handlePaymentFailure(orderId: string): Promise<void> {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) return;

    order.status = "CANCELLED";
    await order.save();

    for (const item of order.items) {
      if (item.variantId) {
        await InventoryService.release(item.variantId.toString(), orderId);
      }
    }

    // Notify Customer & Admin about failed payment
    try {
      await notificationService.notifyPaymentEvent({
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          guestInformation: order.guestInformation,
          total: order.total,
        },
        paymentMethod: order.paymentMethod,
        isSuccess: false,
      });
    } catch (err) {
      console.error("[OrderService.handlePaymentFailure] Error sending payment failure notification:", err);
    }
  }

  /**
   * Cancel an eligible order (PAID / CONFIRMED / PROCESSING).
   * Blocks cancellation once OUT_FOR_DELIVERY.
   */
  static async cancelOrder(
    orderId: string,
    cancelledBy: "CUSTOMER" | "ADMIN",
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    await connectDB();

    const CANCELLABLE: OrderStatus[] = ["PAID", "CONFIRMED", "PROCESSING"];
    const order = await Order.findById(orderId);
    if (!order) return { success: false, error: "Order not found" };

    if (!CANCELLABLE.includes(order.status)) {
      return {
        success: false,
        error:
          "This order can no longer be cancelled because it is already out for delivery.",
      };
    }

    order.status = "CANCELLED";
    order.cancellation = { reason, cancelledBy, cancelledAt: new Date() };

    // If paid, mark for refund
    if (["PAID", "CONFIRMED", "PROCESSING"].includes(order.status)) {
      order.refund = {
        status: "PENDING",
        amount: order.total,
        reason: reason ?? "Customer cancellation",
      };
    }

    await order.save();

    // Release stock
    for (const item of order.items) {
      if (item.variantId) {
        await InventoryService.release(item.variantId.toString(), orderId);
      }
    }

    // Send Cancellation Notifications
    try {
      await notificationService.notifyCustomerOrderEvent(
        {
          _id: order._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          guestInformation: order.guestInformation,
          total: order.total,
        },
        "ORDER_CANCELLED",
        `Order Cancelled #${order.orderNumber}`,
        `Order #${order.orderNumber} has been cancelled${reason ? `: "${reason}"` : ""}.`
      );

      await notificationService.notifyAdminEvent({
        event: "ORDER_CANCELLED",
        category: "ORDERS",
        priority: "HIGH",
        title: `Order Cancelled #${order.orderNumber}`,
        message: `Order #${order.orderNumber} was cancelled by ${cancelledBy}. Reason: ${reason || "N/A"}`,
        entityType: "ORDER",
        entityId: order.orderNumber,
        actionUrl: `/admin/orders/${order.orderNumber}`,
        actionLabel: "View Order",
      });
    } catch (err) {
      console.error("[OrderService.cancelOrder] Error sending cancellation notification:", err);
    }

    return { success: true };
  }

  /** Update order status (admin action) */
  static async updateStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<void> {
    await connectDB();
    await Order.findByIdAndUpdate(orderId, { status });
  }
}
