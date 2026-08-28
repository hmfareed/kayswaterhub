import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Settings from "@/models/Settings";
import { logAdminAction } from "@/services/admin/audit.service";

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("[api/admin/settings GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    await logAdminAction({
      action: "SETTINGS_UPDATED",
      resource: "Settings",
      description: "Updated store, payment, and delivery system settings",
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("[api/admin/settings PUT]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
