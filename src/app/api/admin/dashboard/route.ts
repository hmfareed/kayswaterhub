import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/services/admin/dashboard.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "7days";

    const data = await getDashboardOverview(timeframe);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[api/admin/dashboard GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
