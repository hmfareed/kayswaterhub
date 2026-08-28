import { NextRequest, NextResponse } from "next/server";
import { getAdminPayments } from "@/services/admin/payment.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminPayments({ status, search, page, limit });

    return NextResponse.json({
      success: true,
      stats: result.stats,
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[api/admin/payments GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
