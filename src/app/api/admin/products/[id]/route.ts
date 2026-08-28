import { NextRequest, NextResponse } from "next/server";
import { getAdminProductById, updateAdminProduct, deleteAdminProduct } from "@/services/admin/product.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getAdminProductById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("[api/admin/products/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await updateAdminProduct(id, body);
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("[api/admin/products/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteAdminProduct(id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    console.error("[api/admin/products/[id] DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
