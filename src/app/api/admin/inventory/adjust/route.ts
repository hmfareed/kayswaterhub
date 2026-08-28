import { NextRequest, NextResponse } from "next/server";
import { adjustVariantStock } from "@/services/admin/inventory.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, adjustment, reasonType, note } = body;

    if (!variantId || adjustment === undefined || !reasonType) {
      return NextResponse.json(
        { success: false, error: "variantId, adjustment, and reasonType are required" },
        { status: 400 }
      );
    }

    const result = await adjustVariantStock({
      variantId,
      adjustment: parseInt(adjustment, 10),
      reasonType,
      note,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[api/admin/inventory/adjust POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
