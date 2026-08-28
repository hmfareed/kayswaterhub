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

    // Toggle archive state
    notif.isArchived = !notif.isArchived;
    notif.archivedAt = notif.isArchived ? new Date() : undefined;
    await notif.save();

    return NextResponse.json({
      success: true,
      data: notif,
      isArchived: notif.isArchived,
    });
  } catch (error: any) {
    console.error("[api/admin/notifications/[id]/archive PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to toggle archive state" },
      { status: 500 }
    );
  }
}
