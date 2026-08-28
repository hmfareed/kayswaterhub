import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const notif = await Notification.findById(id);
    if (!notif) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    notif.isRead = false;
    notif.readAt = undefined;
    await notif.save();

    return NextResponse.json({ success: true, data: notif });
  } catch (error: any) {
    console.error("[api/admin/notifications/[id]/unread PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark as unread" },
      { status: 500 }
    );
  }
}
