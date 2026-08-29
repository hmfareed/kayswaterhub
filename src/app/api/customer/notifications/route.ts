import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view notifications." },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isReadParam = searchParams.get("isRead");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const userObjectId = session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;
    const userEmail = session.user.email?.toLowerCase().trim();

    // Query filter for customer notifications:
    // Either assigned specifically to this user (userId or recipientEmail) OR non-order general broadcast
    const userMatchConditions: any[] = [];
    if (userObjectId) userMatchConditions.push({ userId: userObjectId });
    if (userEmail && !userEmail.endsWith("@khadyswater.com")) {
      userMatchConditions.push({ recipientEmail: userEmail });
    }
    // General system announcements / promotions only — NEVER order/payment/delivery events
    userMatchConditions.push({
      recipientRole: "ALL",
      category: { $nin: ["ORDERS", "PAYMENTS", "DELIVERY"] },
    });
    userMatchConditions.push({
      recipientRole: "CUSTOMER",
      userId: null,
      recipientEmail: null,
      category: { $nin: ["ORDERS", "PAYMENTS", "DELIVERY"] },
    });

    const query: any = {
      $or: userMatchConditions,
      isArchived: { $ne: true },
    };

    if (category && category !== "all") {
      const normalizedCat = category.toUpperCase();
      query.category = normalizedCat;
    }

    if (isReadParam !== null && isReadParam !== undefined && isReadParam !== "") {
      query.isRead = isReadParam === "true";
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        $or: userMatchConditions,
        isArchived: { $ne: true },
        isRead: false,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[api/customer/notifications GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
