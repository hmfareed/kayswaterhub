import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { notificationService } from "@/services/notification/NotificationService";
import type { RecipientRole, NotificationCategory, NotificationPriority } from "@/types";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      title,
      message,
      targetRole = "ALL",
      category = "PROMOTIONS",
      priority = "NORMAL",
      actionUrl,
      actionLabel,
    } = body;

    if (!title || !title.trim() || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Title and message are required." },
        { status: 400 }
      );
    }

    const created = await notificationService.broadcastNotification({
      targetRole: targetRole as RecipientRole,
      title: title.trim(),
      message: message.trim(),
      category: category as NotificationCategory,
      priority: priority as NotificationPriority,
      actionUrl: actionUrl?.trim(),
      actionLabel: actionLabel?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Broadcast notification dispatched successfully",
      data: created,
    });
  } catch (error: any) {
    console.error("[api/admin/notifications/broadcast POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to broadcast notification" },
      { status: 500 }
    );
  }
}
