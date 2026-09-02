import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || "khadijahabass273@gmail.com").toLowerCase().trim();
    const defaultPasswordHash = await bcrypt.hash("Admin@123", 12);

    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: "Khadijah Abass",
          email: adminEmail,
          phone: "+233 50 490 3022",
          passwordHash: defaultPasswordHash,
          role: "ADMIN",
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          loginAttempts: 0,
          lockedUntil: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Admin account verified and initialized successfully",
      email: adminUser.email,
      role: adminUser.role,
    });
  } catch (error: any) {
    console.error("[api/auth/admin-init]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize admin" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
