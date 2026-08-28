import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { changePasswordSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { currentPassword, password } = parsed.data;

    await connectDB();

    const user = await User.findById(session.user.id).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // ── Verify current password ───────────────────────────────────────────────
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 400 }
      );
    }

    // ── Update password ───────────────────────────────────────────────────────
    const newPasswordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, { $set: { passwordHash: newPasswordHash } });

    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[change-password] Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
