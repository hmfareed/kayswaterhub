import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const user = session?.user;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isReadParam = searchParams.get("isRead");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    // If visitor is not logged in, return empty notifications with 0 unread
    if (!user || (!user.id && !user.email)) {
      return NextResponse.json({
        success: true,
        data: [],
        unreadCount: 0,
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const userObjectId = user.id && mongoose.Types.ObjectId.isValid(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : null;
    const userEmail = user.email ? user.email.toLowerCase().trim() : null;
    const userPhone = (user as any).phone ? (user as any).phone.trim() : null;

    // Build conditions matching this customer's notifications
    const userMatchConditions: any[] = [];

    if (userObjectId) {
      userMatchConditions.push({ userId: userObjectId });
    }
    if (user.id) {
      userMatchConditions.push({ userId: user.id });
    }
    if (userEmail) {
      userMatchConditions.push({ recipientEmail: userEmail });
    }
    if (userPhone) {
      userMatchConditions.push({ recipientPhone: userPhone });
    }

    // Also match general announcements targeted to all customers
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
      query.category = category.toUpperCase();
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
      { success: false, error: error.message || "Failed to fetch customer notifications" },
      { status: 500 }
    );
  }
}
