import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait a minute and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    // ── Parse & validate ─────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, identifierType, email, phone, password } = parsed.data;

    await connectDB();

    // ── Duplicate check ───────────────────────────────────────────────────────
    if (identifierType === "email" && email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists.", field: "email" },
          { status: 409 }
        );
      }
    }

    if (identifierType === "phone" && phone) {
      const existing = await User.findOne({ phone: phone.trim() });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this phone number already exists.", field: "phone" },
          { status: 409 }
        );
      }
    }

    // ── Hash password ─────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Create user ───────────────────────────────────────────────────────────
    const isAdminEmail = email?.toLowerCase().trim() === "khadijahabass273@gmail.com";
    const userData: Record<string, unknown> = {
      name: name.trim(),
      passwordHash,
      role: isAdminEmail ? "ADMIN" : "CUSTOMER",
    };

    if (identifierType === "email" && email) {
      userData.email = email.toLowerCase().trim();
    }
    if (identifierType === "phone" && phone) {
      userData.phone = phone.trim();
    }

    const user = await User.create(userData);

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email ?? null,
          phone: user.phone ?? null,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[register] Error:", err);

    // Mongoose duplicate key error
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "An account with those details already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
