import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ success: true, count: 0 });
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

    const count = await Notification.countDocuments({
      $or: userMatchConditions,
      isArchived: { $ne: true },
      isRead: false,
    });

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("[api/customer/notifications/unread-count GET]", error);
    return NextResponse.json({ success: true, count: 0 });
  }
}
