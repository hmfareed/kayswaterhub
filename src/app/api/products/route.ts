import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import { STORE_PRODUCTS } from "@/lib/constants";
import { ensureStoreProductsSynced } from "@/services/admin/product.service";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const count = await Product.countDocuments();
    if (count === 0) {
      await ensureStoreProductsSynced(false);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const isFeatured = searchParams.get("featured");

    const query: Record<string, unknown> = { isActive: true };

    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    const products = await Product.find(query)
      .populate("brandId", "name slug logo")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 });

    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({
      productId: { $in: productIds },
      isAvailable: true,
    });

    const mapped = products.map((p) => {
      const pVariants = variants.filter((v) => v.productId.toString() === p._id.toString());
      const minPrice = pVariants.length > 0 ? Math.min(...pVariants.map((v) => v.price)) : 0;
      const maxPrice = pVariants.length > 0 ? Math.max(...pVariants.map((v) => v.price)) : 0;
      const totalStock = pVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);

      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        images: p.images || [],
        brand: (p.brandId as any)?.name || "General",
        brandSlug: (p.brandId as any)?.slug || "general",
        category: (p.categoryId as any)?.name || "Bottled Water",
        categorySlug: (p.categoryId as any)?.slug || "bottled-water",
        price: minPrice,
        minPrice,
        maxPrice,
        stock: totalStock,
        inStock: totalStock > 0,
        isPopular: p.isFeatured,
        isBestSeller: p.isFeatured,
        variants: pVariants,
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    console.error("[api/products GET]", error);
    // Fallback to static store products if DB error
    return NextResponse.json({ success: true, data: STORE_PRODUCTS });
  }
}
