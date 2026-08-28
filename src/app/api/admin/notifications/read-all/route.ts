import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";

export async function PATCH() {
  try {
    await connectDB();

    const result = await Notification.updateMany(
      {
        recipientRole: { $in: ["ADMIN", "ALL"] },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "All admin notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("[api/admin/notifications/read-all PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
