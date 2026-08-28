import { connectDB } from "@/lib/db/mongoose";
import Promotion, { IPromotion } from "@/models/Promotion";
import { logAdminAction } from "./audit.service";

export async function getAdminPromotions(params: {
  search?: string;
  status?: "all" | "active" | "expired";
}) {
  await connectDB();

  const { search, status = "all" } = params;
  const query: Record<string, unknown> = {};

  if (status === "active") {
    query.isActive = true;
    query.endDate = { $gte: new Date() };
  } else if (status === "expired") {
    query.endDate = { $lt: new Date() };
  }

  if (search && search.trim()) {
    query.code = { $regex: search.trim(), $options: "i" };
  }

  const promotions = await Promotion.find(query).sort({ createdAt: -1 });
  return promotions;
}

export async function createPromotion(data: Partial<IPromotion>, adminId?: string) {
  await connectDB();

  const promotion = await Promotion.create({
    ...data,
    code: data.code?.toUpperCase().trim(),
  });

  await logAdminAction({
    performedBy: adminId,
    action: "PROMOTION_CREATED",
    resource: "Promotion",
    resourceId: promotion._id.toString(),
    description: `Created coupon "${promotion.code}" (${promotion.discountType}: ${promotion.discountValue})`,
  });

  return promotion;
}

export async function updatePromotion(id: string, data: Partial<IPromotion>, adminId?: string) {
  await connectDB();

  const promotion = await Promotion.findByIdAndUpdate(id, { $set: data }, { new: true });

  await logAdminAction({
    performedBy: adminId,
    action: "PROMOTION_UPDATED",
    resource: "Promotion",
    resourceId: id,
    description: `Updated coupon "${promotion?.code}"`,
  });

  return promotion;
}

export async function deletePromotion(id: string, adminId?: string) {
  await connectDB();

  const promotion = await Promotion.findByIdAndDelete(id);

  await logAdminAction({
    performedBy: adminId,
    action: "PROMOTION_DELETED",
    resource: "Promotion",
    resourceId: id,
    description: `Deleted coupon "${promotion?.code}"`,
  });

  return true;
}
