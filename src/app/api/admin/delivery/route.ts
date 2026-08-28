import { NextRequest, NextResponse } from "next/server";
import { getAdminDeliveryOverview } from "@/services/admin/delivery.service";

export async function GET() {
  try {
    const overview = await getAdminDeliveryOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    console.error("[api/admin/delivery GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch delivery overview" },
      { status: 500 }
    );
  }
}
