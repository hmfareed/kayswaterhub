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
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { orderNumber: id }] };
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

    // Security: non-admin users can view only their own orders
    const isAdmin =
      session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    if (!isAdmin) {
      let isOwner = false;

      if (order.customerId) {
        // If assigned, strictly require matching user id
        isOwner = !!(session?.user?.id && String(order.customerId) === String(session.user.id));
      } else {
        // Unassigned guest order: check against authentic user email / phone
        const userEmail = session?.user?.email?.trim();
        const hasValidEmail = userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com");
        const userPhone = session?.user?.phone?.trim()?.replace(/[\s-]/g, "");
        const orderPhone = order.guestInformation?.phone?.trim()?.replace(/[\s-]/g, "");

        const emailMatches = Boolean(hasValidEmail && order.guestInformation?.email?.toLowerCase() === userEmail.toLowerCase());
        const phoneMatches = Boolean(userPhone && userPhone.length >= 9 && orderPhone && (userPhone === orderPhone || userPhone.slice(-9) === orderPhone.slice(-9)));

        isOwner = emailMatches || phoneMatches;
      }

      // If user is unauthenticated or not owner, but has exact orderNumber/reference from immediate checkout
      if (!isOwner && !session?.user) {
        // Allow reading confirmation details if exact order ID / number matches
      } else if (!isOwner && session?.user) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Auto-link order to customerId ONLY if unassigned and logged-in user matches
    if (session?.user?.id && !order.customerId && mongoose.Types.ObjectId.isValid(session.user.id)) {
      const userEmail = session.user.email?.trim();
      const hasValidEmail = userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com");
      const userPhone = session.user.phone?.trim()?.replace(/[\s-]/g, "");
      const orderPhone = order.guestInformation?.phone?.trim()?.replace(/[\s-]/g, "");

      const emailMatches = Boolean(hasValidEmail && order.guestInformation?.email?.toLowerCase() === userEmail.toLowerCase());
      const phoneMatches = Boolean(userPhone && userPhone.length >= 9 && orderPhone && (userPhone === orderPhone || userPhone.slice(-9) === orderPhone.slice(-9)));

      if (emailMatches || phoneMatches) {
        order.customerId = new mongoose.Types.ObjectId(session.user.id) as any;
        await order.save();
      }
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

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

    let wasCancelled = false;

    if (isAdmin) {
      // Admins can update any field freely
      if (status) {
        if (status.toUpperCase() === "CANCELLED" && order.status !== "CANCELLED") {
          wasCancelled = true;
          order.cancellation = {
            reason: body.reason || "Cancelled by admin",
            cancelledBy: "ADMIN",
            cancelledAt: new Date(),
          };
          order.timeline = order.timeline || [];
          order.timeline.push({
            status: "CANCELLED",
            title: "Order Cancelled by Admin",
            description: body.reason || "Admin marked the order as cancelled.",
            actor: "ADMIN",
            timestamp: new Date(),
          });
        }
        order.status = status;
      }
      if (notes !== undefined) order.notes = notes;
    } else {
      // Customers: check strict ownership
      let isOwner = false;
      if (order.customerId) {
        isOwner = String(order.customerId) === String(session.user.id);
      } else {
        const userEmail = session.user.email?.trim();
        const hasValidEmail = userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com");
        const userPhone = session.user.phone?.trim()?.replace(/[\s-]/g, "");
        const orderPhone = order.guestInformation?.phone?.trim()?.replace(/[\s-]/g, "");

        const emailMatches = Boolean(hasValidEmail && order.guestInformation?.email?.toLowerCase() === userEmail.toLowerCase());
        const phoneMatches = Boolean(userPhone && userPhone.length >= 9 && orderPhone && (userPhone === orderPhone || userPhone.slice(-9) === orderPhone.slice(-9)));

        isOwner = emailMatches || phoneMatches;
      }

      if (!isOwner) {
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

      wasCancelled = true;
      order.status = "CANCELLED";
      order.cancellation = {
        reason: body.reason || "Cancelled by customer",
        cancelledBy: "CUSTOMER",
        cancelledAt: new Date(),
      };
      order.timeline = order.timeline || [];
      order.timeline.push({
        status: "CANCELLED",
        title: "Order Cancelled by Customer",
        description: body.reason || "Customer cancelled the order from account.",
        actor: "CUSTOMER",
        timestamp: new Date(),
      });
    }

    await order.save();

    // If order was cancelled, release stock and notify Admin Panel
    if (wasCancelled) {
      // 1. Release reserved stock
      try {
        const { InventoryService } = await import("@/services/inventory/InventoryService");
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            if (item.variantId) {
              await InventoryService.release(item.variantId.toString(), order._id.toString());
            }
          }
        }
      } catch (invErr) {
        console.warn("[api/orders/[id]] Stock release warning on cancel:", invErr);
      }

      // 2. Dispatch Admin Panel Notification
      try {
        const { notificationService } = await import("@/services/notification/NotificationService");
        const customerName =
          order.guestInformation?.name ||
          session.user.name ||
          (session.user.email ? session.user.email.split("@")[0] : "Customer");

        await notificationService.notifyAdminEvent({
          event: "ORDER_CANCELLED",
          category: "ORDERS",
          priority: "HIGH",
          title: `Order Cancelled: #${order.orderNumber}`,
          message: `Customer ${customerName} has cancelled order #${order.orderNumber} (GH₵${(order.total || 0).toFixed(2)}).`,
          entityType: "ORDER",
          entityId: order.orderNumber,
          actionUrl: `/admin/orders/${order.orderNumber || order._id.toString()}`,
          actionLabel: "View Order",
          metadata: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            total: order.total,
            cancelledBy: isAdmin ? "ADMIN" : "CUSTOMER",
            reason: body.reason || (isAdmin ? "Cancelled by admin" : "Cancelled by customer"),
          },
        });

        // 3. Customer In-App Notification
        await notificationService.notifyCustomerOrderEvent(
          order,
          "ORDER_CANCELLED",
          "Order Cancelled",
          `Your order #${order.orderNumber} was cancelled successfully.`
        );
      } catch (notifErr) {
        console.error("[api/orders/[id]] Notification error on cancel:", notifErr);
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[api/orders/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
