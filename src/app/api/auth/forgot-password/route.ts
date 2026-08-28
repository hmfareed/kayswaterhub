import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = checkRateLimit(`forgot-password:${ip}`, { maxRequests: 3, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return 200 to prevent email enumeration attacks
    const genericResponse = NextResponse.json(
      {
        message:
          "If an account with that email exists, you will receive a password reset link shortly.",
      },
      { status: 200 }
    );

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return genericResponse;

    // ── Generate reset token ──────────────────────────────────────────────────
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });

    // ── Send email (stub — replace with your email provider) ─────────────────
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}&userId=${user._id.toString()}`;

    console.log("─────────────────────────────────────────────────────");
    console.log("🔑 PASSWORD RESET LINK (dev only — plug in your mailer):");
    console.log(resetUrl);
    console.log("─────────────────────────────────────────────────────");

    // TODO: Replace the console.log above with your email provider, e.g.:
    // await sendEmail({
    //   to: user.email!,
    //   subject: "Reset your Kay's Packs password",
    //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    // });

    return genericResponse;
  } catch (err) {
    console.error("[forgot-password] Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
