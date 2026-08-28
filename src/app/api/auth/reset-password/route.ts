import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = checkRateLimit(`reset-password:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    // ── Parse & validate ──────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // userId is passed as a query param — extract from body for simplicity
    const userId = body.userId as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    await connectDB();

    // Fetch user with reset token fields (normally excluded by select:false)
    const user = await User.findById(userId).select(
      "+resetPasswordToken +resetPasswordExpires"
    );

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // ── Check token validity ──────────────────────────────────────────────────
    if (
      !user.resetPasswordToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const tokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!tokenValid) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    // ── Update password ───────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordHash,
        loginAttempts: 0,
        lockedUntil: undefined,
      },
      $unset: {
        resetPasswordToken: "",
        resetPasswordExpires: "",
      },
    });

    return NextResponse.json(
      { message: "Password updated successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
