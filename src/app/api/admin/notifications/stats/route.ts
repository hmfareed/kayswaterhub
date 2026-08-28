import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    await connectDB();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const baseAdminQuery = { recipientRole: { $in: ["ADMIN", "ALL"] }, isArchived: { $ne: true } };

    const [
      total,
      unread,
      critical,
      todayTotal,
      ordersCount,
      paymentsCount,
      productsCount,
      deliveryCount,
      securityCount,
      systemCount,
    ] = await Promise.all([
      Notification.countDocuments(baseAdminQuery),
      Notification.countDocuments({ ...baseAdminQuery, isRead: false }),
      Notification.countDocuments({ ...baseAdminQuery, priority: "CRITICAL", isRead: false }),
      Notification.countDocuments({ ...baseAdminQuery, createdAt: { $gte: startOfToday } }),
      Notification.countDocuments({ ...baseAdminQuery, category: "ORDERS" }),
      Notification.countDocuments({ ...baseAdminQuery, category: "PAYMENTS" }),
      Notification.countDocuments({ ...baseAdminQuery, category: "PRODUCTS" }),
      Notification.countDocuments({ ...baseAdminQuery, category: "DELIVERY" }),
      Notification.countDocuments({ ...baseAdminQuery, category: "SECURITY" }),
      Notification.countDocuments({ ...baseAdminQuery, category: "SYSTEM" }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        unread,
        critical,
        todayTotal,
        categories: {
          orders: ordersCount,
          payments: paymentsCount,
          products: productsCount,
          delivery: deliveryCount,
          security: securityCount,
          system: systemCount,
        },
      },
    });
  } catch (error: any) {
    console.error("[api/admin/notifications/stats GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notification stats" },
      { status: 500 }
    );
  }
}
