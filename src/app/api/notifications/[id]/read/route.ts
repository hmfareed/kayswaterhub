import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || id.startsWith("demo-notif")) {
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid notification ID" },
        { status: 400 }
      );
    }

    await Notification.findByIdAndUpdate(id, {
      $set: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (error: any) {
    console.error("[api/notifications/[id]/read PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
