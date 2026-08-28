import { NextRequest, NextResponse } from "next/server";
import { generateReportData } from "@/services/admin/report.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") as any) || "sales";
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const data = await generateReportData(type, { dateFrom, dateTo });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[api/admin/reports GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
