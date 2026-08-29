import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import DeliveryOrder from "@/models/DeliveryOrder";
import { logAdminAction } from "@/services/admin/audit.service";

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch live orders in active delivery / packaging lifecycle
    const activeOrders = await Order.find({
      status: {
        $in: [
          "OUT_FOR_DELIVERY",
          "READY_FOR_DELIVERY",
          "PROCESSING",
          "IN_TRANSIT",
          "CONFIRMED",
        ],
      },
    }).sort({ createdAt: -1 });

    // Map to active delivery items
    const deliveries = activeOrders.map((o) => {
      let deliveryStatus = "IN_TRANSIT";
      if (o.status === "PROCESSING" || o.status === "CONFIRMED") deliveryStatus = "PACKING";
      else if (o.status === "READY_FOR_DELIVERY") deliveryStatus = "READY_FOR_PICKUP";
      else if (o.status === "OUT_FOR_DELIVERY") deliveryStatus = "OUT_FOR_DELIVERY";

      return {
        _id: o._id.toString(),
        orderId: {
          _id: o._id.toString(),
          orderNumber: o.orderNumber,
          guestInformation: o.guestInformation,
          total: o.total,
          items: o.items,
        },
        status: deliveryStatus,
        deliveryMethod: o.deliveryMethod || "YANGO_DOOR",
        courierProvider: o.courierProvider || (o.deliveryMethod === "NATIONWIDE_PARCEL" ? "STATION_COURIER" : "YANGO"),
        driverName: o.courierName || (o.status === "OUT_FOR_DELIVERY" ? "Assigned Yango Rider" : "East Legon Dispatch Fleet"),
        driverPhone: o.courierPhone || "+233 24 555 1234",
        estimatedDeliveryFee: o.estimatedDeliveryFee || o.deliveryFee || 0,
        actualDeliveryFee: o.actualDeliveryFee || o.estimatedDeliveryFee || o.deliveryFee || 0,
        deliveryPaymentStatus: o.deliveryPaymentStatus || "EXPECTED",
        trackingReference: o.trackingReference,
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error: any) {
    console.error("[api/admin/delivery/active GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch active deliveries" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Delivery/Order ID and status are required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (order) {
      if (status === "DELIVERED") {
        order.status = "DELIVERED";
        order.timeline.push({
          status: "DELIVERED",
          title: "Order Delivered",
          description: "Water packs safely dropped off at customer location",
          actor: "DELIVERY",
          timestamp: new Date(),
        });
      } else if (status === "IN_TRANSIT" || status === "OUT_FOR_DELIVERY") {
        order.status = "OUT_FOR_DELIVERY";
        order.timeline.push({
          status: "OUT_FOR_DELIVERY",
          title: "Out for Delivery",
          description: "Dispatched from East Legon Hub with delivery courier",
          actor: "DELIVERY",
          timestamp: new Date(),
        });
      }
      await order.save();

      await logAdminAction({
        action: "DELIVERY_UPDATED",
        resource: "Order",
        resourceId: id,
        description: `Updated delivery status for Order #${order.orderNumber} to ${status}`,
      });
    }

    return NextResponse.json({ success: true, message: "Delivery status updated" });
  } catch (error: any) {
    console.error("[api/admin/delivery/active PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
