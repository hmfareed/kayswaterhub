import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const user = session?.user;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    // Default notifications for demo or guests
    const sampleNotifications = [
      {
        _id: "demo-notif-1",
        title: "Welcome to Kay's Packs! 💧",
        message: "Ghana's premier online mineral water delivery hub. Enjoy same-day delivery across Greater Accra!",
        category: "SYSTEM",
        priority: "NORMAL",
        isRead: false,
        actionUrl: "/shop",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "demo-notif-2",
        title: "Free Delivery on Orders Over GH₵100 🎉",
        message: "Stock up on Voltic, Bel-Aqua, or Verna packs and get free doorstep delivery in Greater Accra.",
        category: "PROMOTIONS",
        priority: "LOW",
        isRead: false,
        actionUrl: "/shop",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    if (!user || !user.id) {
      return NextResponse.json({
        success: true,
        data: sampleNotifications,
        unreadCount: sampleNotifications.filter((n) => !n.isRead).length,
      });
    }

    const userConditions: any[] = [
      { recipientRole: "ALL", isArchived: { $ne: true } },
    ];

    if (mongoose.Types.ObjectId.isValid(user.id)) {
      userConditions.push({
        userId: new mongoose.Types.ObjectId(user.id),
        isArchived: { $ne: true },
      });
    }

    if (user.email && !user.email.toLowerCase().endsWith("@khadyswater.com")) {
      userConditions.push({
        recipientEmail: user.email.toLowerCase(),
        isArchived: { $ne: true },
      });
    }

    const userPhone = (user as any).phone;
    if (userPhone) {
      userConditions.push({
        recipientPhone: userPhone,
        isArchived: { $ne: true },
      });
    }

    const query = { $or: userConditions };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({
        ...query,
        isRead: false,
      }),
    ]);

    // If customer has no notifications yet, show friendly welcoming notifications
    const finalData =
      notifications.length > 0
        ? notifications
        : sampleNotifications;

    return NextResponse.json({
      success: true,
      data: finalData,
      unreadCount: notifications.length > 0 ? unreadCount : finalData.filter((n) => !n.isRead).length,
    });
  } catch (error: any) {
    console.error("[api/notifications GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
