import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth } from "@/services/admin/health.service";

export async function GET() {
  try {
    const health = await getSystemHealth();
    return NextResponse.json({ success: true, data: health });
  } catch (error: any) {
    console.error("[api/admin/system-health GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check system health" },
      { status: 500 }
    );
  }
}
