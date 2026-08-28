import { NextRequest, NextResponse } from "next/server";
import {
  getAdminPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/services/admin/promotion.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as any) || "all";

    const promotions = await getAdminPromotions({ search, status });
    return NextResponse.json({ success: true, data: promotions });
  } catch (error: any) {
    console.error("[api/admin/promotions GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const promotion = await createPromotion(body);
    return NextResponse.json({ success: true, data: promotion }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/promotions POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create promotion" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    const promotion = await updatePromotion(id, data);
    return NextResponse.json({ success: true, data: promotion });
  } catch (error: any) {
    console.error("[api/admin/promotions PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    await deletePromotion(id);
    return NextResponse.json({ success: true, message: "Promotion deleted" });
  } catch (error: any) {
    console.error("[api/admin/promotions DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
