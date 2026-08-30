import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { auth } from "@/lib/auth/auth";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ success: true, message: "Marked all as read" });
    }

    const userConditions: any[] = [
      { recipientRole: "ALL" },
    ];

    if (mongoose.Types.ObjectId.isValid(user.id)) {
      userConditions.push({ userId: new mongoose.Types.ObjectId(user.id) });
    }

    if (user.email) {
      userConditions.push({ recipientEmail: user.email.toLowerCase() });
    }

    await Notification.updateMany(
      { $or: userConditions, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("[api/notifications/read-all PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
