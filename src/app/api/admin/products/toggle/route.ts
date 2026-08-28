import { NextRequest, NextResponse } from "next/server";
import { toggleProductActiveStatus, toggleProductFeatured } from "@/services/admin/product.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, field, value } = body;

    if (!productId || !field) {
      return NextResponse.json(
        { success: false, error: "Product ID and field are required" },
        { status: 400 }
      );
    }

    let product;
    if (field === "isActive") {
      product = await toggleProductActiveStatus(productId, !!value);
    } else if (field === "isFeatured") {
      product = await toggleProductFeatured(productId, !!value);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid toggle field" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("[api/admin/products/toggle POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to toggle product status" },
      { status: 500 }
    );
  }
}
