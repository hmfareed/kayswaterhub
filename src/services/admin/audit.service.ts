import { connectDB } from "@/lib/db/mongoose";
import AuditLog from "@/models/AuditLog";
import mongoose from "mongoose";

export interface LogAuditParams {
  performedBy?: string | mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  changes?: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(params: LogAuditParams) {
  try {
    await connectDB();
    const performedById = params.performedBy
      ? typeof params.performedBy === "string"
        ? new mongoose.Types.ObjectId(params.performedBy)
        : params.performedBy
      : new mongoose.Types.ObjectId("000000000000000000000001"); // default system id

    await AuditLog.create({
      performedBy: performedById,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description,
      changes: params.changes || [],
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("[AuditService] Failed to log action:", error);
  }
}
