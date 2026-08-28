import { NextRequest, NextResponse } from "next/server";
import { ensureStoreProductsSynced } from "@/services/admin/product.service";

export async function POST(req: NextRequest) {
  try {
    const { force } = await req.json().catch(() => ({ force: false }));
    const result = await ensureStoreProductsSynced(!!force);
    return NextResponse.json({
      success: true,
      message: "Store products successfully synchronized with database",
      seededCount: result.seededCount,
    });
  } catch (error: any) {
    console.error("[api/admin/products/sync POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync store products" },
      { status: 500 }
    );
  }
}
