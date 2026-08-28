import { NextRequest, NextResponse } from "next/server";
import {
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} from "@/services/admin/review.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getAdminReviews({ status, search, page, limit });
    return NextResponse.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[api/admin/reviews GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "ID and status are required" },
        { status: 400 }
      );
    }

    const review = await updateReviewStatus(id, status);
    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    console.error("[api/admin/reviews PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review status" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    await deleteReview(id);
    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error: any) {
    console.error("[api/admin/reviews DELETE]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
