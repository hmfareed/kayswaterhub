import { NextRequest, NextResponse } from "next/server";
import { getAdminProducts, createAdminProduct } from "@/services/admin/product.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const status = (searchParams.get("status") as any) || "all";
    const stockStatus = (searchParams.get("stockStatus") as any) || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminProducts({
      search,
      category,
      brand,
      status,
      stockStatus,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.products,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[api/admin/products GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await createAdminProduct(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/products POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
