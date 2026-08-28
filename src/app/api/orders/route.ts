import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    await connectDB();

    const query: Record<string, unknown> = {};

    // Customer gets only their own orders; admin gets all
    if (session?.user?.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      query.customerId = session.user.id;
    }

    if (status && status !== "all") {
      query.status = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "guestInformation.name": { $regex: search, $options: "i" } },
        { "guestInformation.phone": { $regex: search, $options: "i" } },
        { "deliveryAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("paymentId")
      .populate("deliveryId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[api/orders GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
