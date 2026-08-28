import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const notif = await Notification.findById(id);
    if (!notif) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Soft delete / archive
    notif.isArchived = true;
    notif.archivedAt = new Date();
    await notif.save();

    return NextResponse.json({
      success: true,
      message: "Notification removed",
    });
  } catch (error: any) {
    console.error("[api/customer/notifications/[id] DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove notification" },
      { status: 500 }
    );
  }
}
