import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    await connectDB();

    const query: Record<string, unknown> = {};

    // Customer gets only their own orders (matching customerId OR email OR phone); admin gets all
    if (session?.user?.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      const userConditions: any[] = [];

      // Match by customerId
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        userConditions.push({ customerId: new mongoose.Types.ObjectId(session.user.id) });
      }
      userConditions.push({ customerId: session.user.id });

      // Match by email
      if (session.user.email) {
        const escapedEmail = session.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        userConditions.push({
          "guestInformation.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });
      }

      // Match by phone
      if (session.user.phone) {
        const cleanPhone = session.user.phone.replace(/[\s-]/g, "");
        userConditions.push({ "guestInformation.phone": session.user.phone });
        if (cleanPhone) {
          userConditions.push({
            "guestInformation.phone": { $regex: new RegExp(cleanPhone.slice(-9), "i") },
          });
        }
      }

      query.$or = userConditions;

      // Auto-link any matching unlinked guest orders to this customerId in background
      try {
        if (mongoose.Types.ObjectId.isValid(session.user.id) && (session.user.email || session.user.phone)) {
          const unlinkedQuery: any = { customerId: { $exists: false } };
          const unlinkedOr: any[] = [];
          if (session.user.email) {
            unlinkedOr.push({
              "guestInformation.email": {
                $regex: new RegExp(`^${session.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
              },
            });
          }
          if (session.user.phone) {
            unlinkedOr.push({ "guestInformation.phone": session.user.phone });
          }
          if (unlinkedOr.length > 0) {
            unlinkedQuery.$or = unlinkedOr;
            await Order.updateMany(unlinkedQuery, {
              $set: { customerId: new mongoose.Types.ObjectId(session.user.id) },
            });
          }
        }
      } catch (linkErr) {
        console.warn("[api/orders] Non-blocking error linking past orders:", linkErr);
      }
    } else if (!session?.user?.id) {
      // Unauthenticated visitor fetching /api/orders without session
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit, totalPages: 0 },
      });
    }

    if (status && status !== "all") {
      const s = status.toUpperCase();
      if (s === "PENDING" || s === "PENDING_PAYMENT") {
        query.status = { $in: ["PENDING_PAYMENT", "PENDING"] };
      } else if (s === "CONFIRMED" || s === "PAID") {
        query.status = { $in: ["PAID", "CONFIRMED"] };
      } else if (s === "OUT_FOR_DELIVERY" || s === "IN_TRANSIT") {
        query.status = { $in: ["OUT_FOR_DELIVERY", "IN_TRANSIT", "READY_FOR_DELIVERY"] };
      } else if (s === "CANCELLED") {
        query.status = { $in: ["CANCELLED", "FAILED_DELIVERY"] };
      } else {
        query.status = s;
      }
    }

    if (search && search.trim()) {
      const sRegex = { $regex: search.trim(), $options: "i" };
      const searchConditions = [
        { orderNumber: sRegex },
        { "guestInformation.name": sRegex },
        { "guestInformation.phone": sRegex },
        { "deliveryAddress.city": sRegex },
        { "deliveryAddress.area": sRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
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
