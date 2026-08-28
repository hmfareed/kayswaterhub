import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import AuditLog from "@/models/AuditLog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const resource = searchParams.get("resource") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;

    const logs = await AuditLog.find(query)
      .populate("performedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("[api/admin/audit-logs GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
