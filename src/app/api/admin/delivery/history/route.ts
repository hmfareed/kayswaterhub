import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import DeliveryOrder from "@/models/DeliveryOrder";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Fetch delivered or past delivery orders
    const orders = await Order.find({
      status: { $in: ["DELIVERED", "OUT_FOR_DELIVERY", "FAILED_DELIVERY", "CANCELLED"] },
    }).sort({ updatedAt: -1, createdAt: -1 });

    const history = orders.map((o) => {
      return {
        _id: o._id.toString(),
        orderId: {
          _id: o._id.toString(),
          orderNumber: o.orderNumber,
          guestInformation: o.guestInformation,
          total: o.total,
          items: o.items,
        },
        status: o.status,
        distanceKm: 4.5,
        deliveryFee: o.deliveryFee || 20,
        driverName: "Kwame Mensah (Courier #4)",
        driverPhone: "+233 24 555 1234",
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt || o.createdAt,
      };
    });

    const totalDelivered = history.filter((h) => h.status === "DELIVERED").length;
    const totalDeliveryFees = history.reduce((sum, h) => sum + (h.deliveryFee || 0), 0);

    return NextResponse.json({
      success: true,
      data: history,
      stats: {
        totalDispatches: history.length,
        totalDelivered,
        totalDeliveryFees,
      },
    });
  } catch (error: any) {
    console.error("[api/admin/delivery/history GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch delivery history" },
      { status: 500 }
    );
  }
}
