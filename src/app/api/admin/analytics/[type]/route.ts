import { NextRequest, NextResponse } from "next/server";
import {
  getSalesAnalytics,
  getProductsAnalytics,
  getCustomersAnalytics,
  getDeliveryAnalytics,
} from "@/services/admin/analytics.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "30days";

    switch (type) {
      case "sales": {
        const data = await getSalesAnalytics(timeframe);
        return NextResponse.json({ success: true, data });
      }
      case "products": {
        const data = await getProductsAnalytics();
        return NextResponse.json({ success: true, data });
      }
      case "customers": {
        const data = await getCustomersAnalytics();
        return NextResponse.json({ success: true, data });
      }
      case "delivery": {
        const data = await getDeliveryAnalytics();
        return NextResponse.json({ success: true, data });
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[api/admin/analytics/[type] GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
