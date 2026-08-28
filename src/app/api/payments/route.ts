import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status.toUpperCase();
    }
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const payments = await Payment.find(query)
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[api/payments GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
