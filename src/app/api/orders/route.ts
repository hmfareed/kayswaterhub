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

    // Customer gets only their own orders (matching customerId OR unassigned guest orders matching verified email/phone); admin gets all
    if (session?.user?.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      const userConditions: any[] = [];

      // 1. Primary: Owned orders directly tied to this customer's user ID
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        userConditions.push({ customerId: new mongoose.Types.ObjectId(session.user.id) });
      }
      userConditions.push({ customerId: session.user.id });

      // 2. Secondary: Unassigned guest orders (customerId is null/undefined) strictly matching user's exact credentials
      const unlinkedConditions: any[] = [];
      const userEmail = session.user.email?.trim();
      if (userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com")) {
        const escapedEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        unlinkedConditions.push({
          "guestInformation.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });
      }

      const rawPhone = session.user.phone?.trim();
      const cleanPhone = rawPhone ? rawPhone.replace(/[\s-]/g, "") : "";
      if (cleanPhone && cleanPhone.length >= 9) {
        unlinkedConditions.push({ "guestInformation.phone": rawPhone });
        unlinkedConditions.push({ "guestInformation.phone": cleanPhone });
        const last9 = cleanPhone.slice(-9);
        unlinkedConditions.push({ "guestInformation.phone": `0${last9}` });
        unlinkedConditions.push({ "guestInformation.phone": `+233${last9}` });
        unlinkedConditions.push({ "guestInformation.phone": `233${last9}` });
      }

      if (unlinkedConditions.length > 0) {
        userConditions.push({
          customerId: { $in: [null, undefined] },
          $or: unlinkedConditions,
        });
      }

      query.$or = userConditions;

      // Auto-link matching UNASSIGNED guest orders to this customerId asynchronously
      if (mongoose.Types.ObjectId.isValid(session.user.id) && unlinkedConditions.length > 0) {
        const userId = session.user.id;
        (async () => {
          try {
            await Order.updateMany(
              { customerId: { $in: [null, undefined] }, $or: unlinkedConditions },
              { $set: { customerId: new mongoose.Types.ObjectId(userId) } }
            );
          } catch (err) {
            console.warn("[api/orders] Background guest link warning:", err);
          }
        })();
      }
    } else if (!session?.user?.id) {
      // Unauthenticated visitor fetching /api/orders without session
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit, totalPages: 0 },
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
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

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[api/orders GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
