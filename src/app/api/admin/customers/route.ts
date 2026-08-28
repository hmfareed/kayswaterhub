import { NextRequest, NextResponse } from "next/server";
import { getAdminCustomers } from "@/services/admin/customer.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as any) || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminCustomers({ search, status, page, limit });

    return NextResponse.json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[api/admin/customers GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
