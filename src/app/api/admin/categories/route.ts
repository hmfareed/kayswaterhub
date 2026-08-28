import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { logAdminAction } from "@/services/admin/audit.service";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    
    // Count products per category
    const counts = await Product.aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc: any, cur: any) => {
      acc[cur._id?.toString()] = cur.count;
      return acc;
    }, {});

    const enriched = categories.map((c) => ({
      ...c.toObject(),
      productCount: countMap[c._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    console.error("[api/admin/categories GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const category = await Category.create({
      name: body.name,
      slug,
      description: body.description,
      image: body.image,
      isActive: body.isActive !== undefined ? body.isActive : true,
      displayOrder: body.displayOrder || 0,
    });

    await logAdminAction({
      action: "CATEGORY_CREATED",
      resource: "Category",
      resourceId: category._id.toString(),
      description: `Created category "${category.name}"`,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/categories POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...data } = body;

    const category = await Category.findByIdAndUpdate(id, { $set: data }, { new: true });
    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error("[api/admin/categories PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
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

    const productsUsingCat = await Product.countDocuments({ categoryId: id });
    if (productsUsingCat > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${productsUsingCat} product(s) still use this category` },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("[api/admin/categories DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
