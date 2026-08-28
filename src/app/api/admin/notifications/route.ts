import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {
      recipientRole: { $in: ["ADMIN", "ALL"] },
    };

    // Filter by category
    if (category && category !== "all") {
      if (category === "stock") {
        query.category = "PRODUCTS";
      } else {
        query.category = category.toUpperCase();
      }
    }

    // Filter by read / archive status
    if (status === "unread") {
      query.isRead = false;
      query.isArchived = { $ne: true };
    } else if (status === "read") {
      query.isRead = true;
      query.isArchived = { $ne: true };
    } else if (status === "archived") {
      query.isArchived = true;
    } else {
      // "all" active alerts
      query.isArchived = { $ne: true };
    }

    // Filter by priority
    if (priority && priority !== "all") {
      query.priority = priority.toUpperCase();
    }

    // Keyword search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: { $regex: regex } },
        { message: { $regex: regex } },
        { entityId: { $regex: regex } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipientRole: { $in: ["ADMIN", "ALL"] },
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
    console.error("[api/admin/notifications GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope"); // "read" | "all"

    if (scope === "read") {
      const result = await Notification.deleteMany({
        recipientRole: { $in: ["ADMIN", "ALL"] },
        isRead: true,
      });
      return NextResponse.json({
        success: true,
        message: "Read notifications deleted",
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid delete scope specified" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[api/admin/notifications DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
