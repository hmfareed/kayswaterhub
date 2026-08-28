import { NextRequest, NextResponse } from "next/server";
import { getAdminInventoryOverview, getInventoryTransactions } from "@/services/admin/inventory.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const statusFilter = (searchParams.get("status") as any) || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const [overview, transactions] = await Promise.all([
      getAdminInventoryOverview({ search, statusFilter, page, limit }),
      getInventoryTransactions(15),
    ]);

    return NextResponse.json({
      success: true,
      stats: overview.stats,
      data: overview.items,
      pagination: overview.pagination,
      transactions,
    });
  } catch (error: any) {
    console.error("[api/admin/inventory GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
