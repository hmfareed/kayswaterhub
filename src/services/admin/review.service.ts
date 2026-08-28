import { connectDB } from "@/lib/db/mongoose";
import Review, { IReview } from "@/models/Review";
import { logAdminAction } from "./audit.service";

export async function getAdminReviews(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const { status, search, page = 1, limit = 20 } = params;
  const query: Record<string, unknown> = {};

  if (status && status !== "all") {
    query.status = status.toUpperCase();
  }

  if (search && search.trim()) {
    query.$or = [
      { customerName: { $regex: search.trim(), $options: "i" } },
      { comment: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate("productId", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateReviewStatus(id: string, status: string, adminId?: string) {
  await connectDB();

  const review = await Review.findByIdAndUpdate(id, { $set: { status } }, { new: true });

  await logAdminAction({
    performedBy: adminId,
    action: "REVIEW_STATUS_UPDATED",
    resource: "Review",
    resourceId: id,
    description: `Review status changed to ${status}`,
  });

  return review;
}

export async function deleteReview(id: string, adminId?: string) {
  await connectDB();

  const review = await Review.findByIdAndDelete(id);

  await logAdminAction({
    performedBy: adminId,
    action: "REVIEW_DELETED",
    resource: "Review",
    resourceId: id,
    description: `Deleted customer review`,
  });

  return true;
}
