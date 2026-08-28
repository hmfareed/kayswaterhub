import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userObjectId = session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;
    const userEmail = session.user.email?.toLowerCase().trim();

    const userMatchConditions: any[] = [];
    if (userObjectId) userMatchConditions.push({ userId: userObjectId });
    if (userEmail) userMatchConditions.push({ recipientEmail: userEmail });
    userMatchConditions.push({ recipientRole: "ALL" });
    userMatchConditions.push({ recipientRole: "CUSTOMER", userId: null, recipientEmail: null });

    const result = await Notification.updateMany(
      {
        $or: userMatchConditions,
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
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("[api/customer/notifications/read-all PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
