import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import Notification, { INotification } from "@/models/Notification";
import User from "@/models/User";
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationCategory,
  NotificationPriority,
  RecipientRole,
} from "@/types";

export interface CreateNotificationParams {
  recipientRole?: RecipientRole;
  userId?: string | mongoose.Types.ObjectId;
  recipientEmail?: string;
  recipientPhone?: string;
  channel?: NotificationChannel;
  event: NotificationEvent;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  entityType?: "ORDER" | "PAYMENT" | "PRODUCT" | "DELIVERY" | "USER" | "PROMOTION" | "SYSTEM";
  entityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationPayload {
  userId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ─── Channel provider interfaces ──────────────────────────────────────────────
export interface IEmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export interface ISMSProvider {
  send(to: string, message: string): Promise<void>;
}

// ─── Stub providers (ready for SendGrid / Termii integration) ─────────────────
class StubEmailProvider implements IEmailProvider {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`[EmailProvider] Sent to: ${to} | Subject: "${subject}"`);
  }
}

class StubSMSProvider implements ISMSProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[SMSProvider] Sent to: ${to} | Body: "${message}"`);
  }
}

// ─── NotificationService ──────────────────────────────────────────────────────
export class NotificationService {
  private emailProvider: IEmailProvider;
  private smsProvider: ISMSProvider;

  constructor(email?: IEmailProvider, sms?: ISMSProvider) {
    this.emailProvider = email ?? new StubEmailProvider();
    this.smsProvider = sms ?? new StubSMSProvider();
  }

  /**
   * Primary method to persist an authoritative in-app notification
   * and optionally trigger delivery channels (Email/SMS).
   */
  async createNotification(params: CreateNotificationParams): Promise<INotification> {
    await connectDB();

    let resolvedUserId = params.userId ? new mongoose.Types.ObjectId(params.userId.toString()) : undefined;

    // If userId not provided but email is, try resolving user
    if (!resolvedUserId && params.recipientEmail && params.recipientRole !== "ADMIN") {
      try {
        const foundUser = await User.findOne({
          email: { $regex: new RegExp(`^${params.recipientEmail.trim()}$`, "i") },
        }).select("_id");
        if (foundUser) {
          resolvedUserId = foundUser._id;
        }
      } catch (err) {
        console.warn("[NotificationService] Error looking up user by email:", err);
      }
    }

    const recipientRole = params.recipientRole || (resolvedUserId ? "CUSTOMER" : "ADMIN");
    const category = params.category || this.inferCategory(params.event);
    const priority = params.priority || this.inferPriority(params.event);
    const channel = params.channel || "IN_APP";

    const notif = await Notification.create({
      recipientRole,
      userId: resolvedUserId,
      recipientEmail: params.recipientEmail,
      recipientPhone: params.recipientPhone,
      channel,
      event: params.event,
      type: params.event,
      category,
      priority,
      title: params.title,
      message: params.message,
      body: params.message,
      icon: params.icon,
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      metadata: params.metadata,
      data: params.metadata,
      isRead: false,
      isArchived: false,
      isSent: true,
      sentAt: new Date(),
    });

    // Optional dispatch to secondary channels
    if (params.recipientEmail && (channel === "EMAIL" || priority === "CRITICAL")) {
      this.emailProvider.send(params.recipientEmail, params.title, params.message).catch((err) => {
        console.error("[NotificationService] Email delivery failed:", err);
      });
    }

    if (params.recipientPhone && channel === "SMS") {
      this.smsProvider.send(params.recipientPhone, params.message).catch((err) => {
        console.error("[NotificationService] SMS delivery failed:", err);
      });
    }

    return notif;
  }

  /**
   * Helper: Customer Order Event notification
   */
  async notifyCustomerOrderEvent(
    order: {
      _id: any;
      orderNumber: string;
      customerId?: any;
      guestInformation?: { email?: string; name?: string; phone?: string };
      total?: number;
    },
    event: NotificationEvent,
    customTitle?: string,
    customMessage?: string
  ): Promise<INotification | null> {
    const title = customTitle || this.getDefaultTitleForEvent(event, order.orderNumber);
    const message = customMessage || this.getDefaultMessageForEvent(event, order.orderNumber);

    return this.createNotification({
      recipientRole: "CUSTOMER",
      userId: order.customerId,
      recipientEmail: order.guestInformation?.email,
      recipientPhone: order.guestInformation?.phone,
      channel: "IN_APP",
      event,
      category: "ORDERS",
      priority: event === "PAYMENT_FAILED" || event === "ORDER_CANCELLED" ? "HIGH" : "NORMAL",
      title,
      message,
      entityType: "ORDER",
      entityId: order.orderNumber || order._id.toString(),
      actionUrl: "/account?tab=orders",
      actionLabel: "View Order",
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });
  }

  /**
   * Helper: Admin Operations Event notification
   */
  async notifyAdminEvent(params: {
    event: NotificationEvent;
    category: NotificationCategory;
    priority?: NotificationPriority;
    title: string;
    message: string;
    entityType?: "ORDER" | "PAYMENT" | "PRODUCT" | "DELIVERY" | "USER" | "SYSTEM";
    entityId?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  }): Promise<INotification> {
    return this.createNotification({
      recipientRole: "ADMIN",
      event: params.event,
      category: params.category,
      priority: params.priority || "NORMAL",
      title: params.title,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel || "View Details",
      metadata: params.metadata,
    });
  }

  /**
   * Helper: Low Stock / Out of Stock alerts for Admin (with 1-hour deduplication)
   */
  async notifyStockAlert(params: {
    productName: string;
    variantName?: string;
    currentStock: number;
    threshold: number;
    variantId: string;
    productId?: string;
  }): Promise<INotification | null> {
    await connectDB();

    const isOutOfStock = params.currentStock <= 0;
    const event: NotificationEvent = isOutOfStock ? "OUT_OF_STOCK" : "LOW_STOCK";
    const priority: NotificationPriority = isOutOfStock ? "CRITICAL" : "HIGH";

    // Deduplication check: check if an unread notification for this variant was created in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await Notification.findOne({
      recipientRole: "ADMIN",
      event,
      entityId: params.variantId,
      isRead: false,
      createdAt: { $gte: oneHourAgo },
    });

    if (existing) {
      return existing; // Suppress duplicate spam
    }

    const title = isOutOfStock
      ? `Out of Stock Alert: ${params.productName}`
      : `Low Stock Alert: ${params.productName}`;

    const message = isOutOfStock
      ? `${params.productName} (${params.variantName || "Standard"}) is completely sold out.`
      : `${params.productName} (${params.variantName || "Standard"}) has only ${params.currentStock} units remaining (Threshold: ${params.threshold}).`;

    return this.createNotification({
      recipientRole: "ADMIN",
      event,
      category: "PRODUCTS",
      priority,
      title,
      message,
      entityType: "PRODUCT",
      entityId: params.variantId,
      actionUrl: "/admin/inventory",
      actionLabel: "Manage Inventory",
      metadata: {
        variantId: params.variantId,
        productId: params.productId,
        currentStock: params.currentStock,
        threshold: params.threshold,
      },
    });
  }

  /**
   * Helper: Payment Confirmed / Failed Event
   */
  async notifyPaymentEvent(params: {
    order: {
      _id: any;
      orderNumber: string;
      customerId?: any;
      guestInformation?: { email?: string; name?: string; phone?: string };
      total?: number;
    };
    paymentMethod?: string;
    isSuccess: boolean;
    errorReason?: string;
  }): Promise<void> {
    const { order, paymentMethod = "Paystack", isSuccess, errorReason } = params;

    if (isSuccess) {
      // 1. Notify Customer
      await this.createNotification({
        recipientRole: "CUSTOMER",
        userId: order.customerId,
        recipientEmail: order.guestInformation?.email,
        recipientPhone: order.guestInformation?.phone,
        event: "PAYMENT_SUCCESS",
        category: "PAYMENTS",
        priority: "NORMAL",
        title: "Payment Confirmed ✅",
        message: `Payment of GH₵${(order.total || 0).toFixed(2)} for order #${order.orderNumber} was received successfully.`,
        entityType: "ORDER",
        entityId: order.orderNumber,
        actionUrl: "/account?tab=orders",
        actionLabel: "View Order",
        metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber, total: order.total },
      });

      // 2. Notify Admin
      await this.notifyAdminEvent({
        event: "PAYMENT_RECEIVED",
        category: "PAYMENTS",
        priority: "NORMAL",
        title: `Payment Received: Order #${order.orderNumber}`,
        message: `Payment of GH₵${(order.total || 0).toFixed(2)} received via ${paymentMethod} from ${order.guestInformation?.name || "Customer"}.`,
        entityType: "ORDER",
        entityId: order.orderNumber,
        actionUrl: `/admin/orders/${order.orderNumber || order._id.toString()}`,
        actionLabel: "View Order",
        metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber, total: order.total },
      });
    } else {
      // 1. Notify Customer
      await this.createNotification({
        recipientRole: "CUSTOMER",
        userId: order.customerId,
        recipientEmail: order.guestInformation?.email,
        recipientPhone: order.guestInformation?.phone,
        event: "PAYMENT_FAILED",
        category: "PAYMENTS",
        priority: "HIGH",
        title: "Payment Unsuccessful ⚠️",
        message: errorReason || `We couldn't confirm your payment for order #${order.orderNumber}. Please try again.`,
        entityType: "ORDER",
        entityId: order.orderNumber,
        actionUrl: "/account?tab=orders",
        actionLabel: "Review Order",
        metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      });

      // 2. Notify Admin
      await this.notifyAdminEvent({
        event: "FAILED_PAYMENT",
        category: "PAYMENTS",
        priority: "HIGH",
        title: `Payment Failed for Order #${order.orderNumber}`,
        message: `Payment attempt for Order #${order.orderNumber} (GH₵${(order.total || 0).toFixed(2)}) failed. Reason: ${errorReason || "Declined / timeout"}.`,
        entityType: "ORDER",
        entityId: order.orderNumber,
        actionUrl: `/admin/orders/${order.orderNumber || order._id.toString()}`,
        actionLabel: "Inspect Order",
        metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      });
    }
  }

  /**
   * Helper: Broadcast system/promotional announcement
   */
  async broadcastNotification(params: {
    targetRole: RecipientRole;
    title: string;
    message: string;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<INotification> {
    return this.createNotification({
      recipientRole: params.targetRole,
      event: params.category === "PROMOTIONS" ? "PROMOTION" : "ANNOUNCEMENT",
      category: params.category || "SYSTEM",
      priority: params.priority || "NORMAL",
      title: params.title,
      message: params.message,
      entityType: "SYSTEM",
      actionUrl: params.actionUrl || "/",
      actionLabel: params.actionLabel || "Learn More",
    });
  }

  // ── Legacy send method compatibility ──────────────────────────────────────
  async send(payload: SendNotificationPayload): Promise<void> {
    await this.createNotification({
      userId: payload.userId,
      recipientEmail: payload.recipientEmail,
      recipientPhone: payload.recipientPhone,
      channel: payload.channel,
      event: payload.event,
      title: payload.title,
      message: payload.body,
      metadata: payload.data,
    });
  }

  async sendMulti(
    base: Omit<SendNotificationPayload, "channel">,
    channels: NotificationChannel[]
  ): Promise<void> {
    await Promise.allSettled(
      channels.map((channel) => this.send({ ...base, channel }))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private inferCategory(event: NotificationEvent): NotificationCategory {
    if (
      event.startsWith("ORDER_") ||
      event === "NEW_ORDER" ||
      event === "BULK_REQUEST" ||
      event === "BULK_QUOTE_READY"
    )
      return "ORDERS";
    if (
      event.startsWith("PAYMENT_") ||
      event.startsWith("REFUND_") ||
      event === "FAILED_PAYMENT"
    )
      return "PAYMENTS";
    if (
      event.startsWith("DELIVERY_") ||
      event === "OUT_FOR_DELIVERY" ||
      event === "DELIVERED" ||
      event === "FAILED_DELIVERY"
    )
      return "DELIVERY";
    if (event === "LOW_STOCK" || event === "OUT_OF_STOCK") return "PRODUCTS";
    if (event === "ACCOUNT_WELCOME") return "CUSTOMERS";
    if (event === "SECURITY_ALERT") return "SECURITY";
    if (event === "PROMOTION") return "PROMOTIONS";
    return "SYSTEM";
  }

  private inferPriority(event: NotificationEvent): NotificationPriority {
    if (event === "SECURITY_ALERT" || event === "OUT_OF_STOCK" || event === "SYSTEM_ALERT")
      return "CRITICAL";
    if (
      event === "PAYMENT_FAILED" ||
      event === "FAILED_PAYMENT" ||
      event === "LOW_STOCK" ||
      event === "FAILED_DELIVERY" ||
      event === "ORDER_CANCELLED"
    )
      return "HIGH";
    if (event === "PROMOTION") return "LOW";
    return "NORMAL";
  }

  private getDefaultTitleForEvent(event: NotificationEvent, orderNumber: string): string {
    switch (event) {
      case "ORDER_PLACED":
        return `Order Placed #${orderNumber}`;
      case "ORDER_CONFIRMED":
        return `Order Confirmed #${orderNumber}`;
      case "ORDER_PROCESSING":
        return `Order Being Prepared #${orderNumber}`;
      case "DELIVERY_ASSIGNED":
        return `Driver Assigned for #${orderNumber}`;
      case "OUT_FOR_DELIVERY":
        return `Out for Delivery 🚐 #${orderNumber}`;
      case "DELIVERED":
        return `Order Delivered 🎉 #${orderNumber}`;
      case "ORDER_CANCELLED":
        return `Order Cancelled #${orderNumber}`;
      case "REFUND_INITIATED":
        return `Refund Initiated #${orderNumber}`;
      case "REFUND_PROCESSED":
        return `Refund Completed #${orderNumber}`;
      default:
        return `Update on Order #${orderNumber}`;
    }
  }

  private getDefaultMessageForEvent(event: NotificationEvent, orderNumber: string): string {
    switch (event) {
      case "ORDER_PLACED":
        return `Your order #${orderNumber} has been received and is being processed.`;
      case "ORDER_CONFIRMED":
        return `Your order #${orderNumber} has been verified and confirmed.`;
      case "ORDER_PROCESSING":
        return `Our warehouse team is packing your items for order #${orderNumber}.`;
      case "DELIVERY_ASSIGNED":
        return `A delivery driver has been assigned to transport your order #${orderNumber}.`;
      case "OUT_FOR_DELIVERY":
        return `Your order #${orderNumber} is on its way to your delivery address.`;
      case "DELIVERED":
        return `Your order #${orderNumber} was delivered successfully. Enjoy your hydration!`;
      case "ORDER_CANCELLED":
        return `Order #${orderNumber} has been cancelled.`;
      case "REFUND_INITIATED":
        return `Your refund request for order #${orderNumber} has been registered and is being processed.`;
      case "REFUND_PROCESSED":
        return `Your refund for order #${orderNumber} has been processed back to your original payment method.`;
      default:
        return `There is a new update regarding order #${orderNumber}.`;
    }
  }
}

export const notificationService = new NotificationService();
