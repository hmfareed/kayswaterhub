import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    await connectDB();

    const count = await Notification.countDocuments({
      recipientRole: { $in: ["ADMIN", "ALL"] },
      isArchived: { $ne: true },
      isRead: false,
    });

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("[api/admin/notifications/unread-count GET]", error);
    return NextResponse.json({ success: true, count: 0 });
  }
}
