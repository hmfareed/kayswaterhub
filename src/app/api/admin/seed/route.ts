import { NextRequest, NextResponse } from "next/server";
import { seedAdminDatabase } from "@/services/admin/seed.service";

export async function POST(req: NextRequest) {
  try {
    const result = await seedAdminDatabase();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("[api/admin/seed POST]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
