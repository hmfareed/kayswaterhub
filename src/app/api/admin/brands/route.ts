import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Brand from "@/models/Brand";
import Product from "@/models/Product";
import { logAdminAction } from "@/services/admin/audit.service";

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ name: 1 });
    
    // Count products per brand
    const counts = await Product.aggregate([
      { $group: { _id: "$brandId", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc: any, cur: any) => {
      acc[cur._id?.toString()] = cur.count;
      return acc;
    }, {});

    const enriched = brands.map((b) => ({
      ...b.toObject(),
      productCount: countMap[b._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("[api/admin/brands GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const brand = await Brand.create({
      name: body.name,
      slug,
      description: body.description,
      tagline: body.tagline,
      logo: body.logo,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    await logAdminAction({
      action: "BRAND_CREATED",
      resource: "Brand",
      resourceId: brand._id.toString(),
      description: `Created brand "${brand.name}"`,
    });

    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/brands POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...data } = body;

    const brand = await Brand.findByIdAndUpdate(id, { $set: data }, { new: true });
    return NextResponse.json({ success: true, data: brand });
  } catch (error: any) {
    console.error("[api/admin/brands PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    const productsUsingBrand = await Product.countDocuments({ brandId: id });
    if (productsUsingBrand > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${productsUsingBrand} product(s) still use this brand` },
        { status: 400 }
      );
    }

    await Brand.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Brand deleted" });
  } catch (error: any) {
    console.error("[api/admin/brands DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
