import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { registerSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/auth/rate-limit";

/**
 * Strips spaces, dashes, parentheses and dots from a phone string.
 * e.g. "024 123 4567" → "0241234567"
 *      "+233 (24) 123-4567" → "+233241234567"
 */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

/**
 * Checks whether any existing user has a phone that shares the same
 * last-9 digits — this catches all Ghana format variants:
 *   0241234567, +233241234567, 233241234567, 024 123 4567, etc.
 */
async function phoneAlreadyExists(phone: string): Promise<boolean> {
  const cleaned = normalizePhone(phone);
  if (cleaned.length < 9) return false;
  const last9 = cleaned.slice(-9);
  const exists = await User.exists({
    phone: { $regex: new RegExp(`${last9}$`) },
  });
  return !!exists;
}

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
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.exists({ email: normalizedEmail });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email address already exists. Please sign in instead.", field: "email" },
          { status: 409 }
        );
      }
    }

    if (identifierType === "phone" && phone) {
      const taken = await phoneAlreadyExists(phone);
      if (taken) {
        return NextResponse.json(
          { error: "An account with this phone number already exists. Please sign in instead.", field: "phone" },
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
      // Always store email lowercase
      userData.email = email.toLowerCase().trim();
    }
    if (identifierType === "phone" && phone) {
      // Store the phone in a cleaned, normalised format (no spaces/dashes)
      userData.phone = normalizePhone(phone);
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

    // Mongoose duplicate key error (safety net — unique index catches anything we missed)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      const keyErr = err as { keyValue?: Record<string, unknown> };
      const isEmail = keyErr.keyValue && "email" in keyErr.keyValue;
      const isPhone = keyErr.keyValue && "phone" in keyErr.keyValue;
      return NextResponse.json(
        {
          error: isEmail
            ? "An account with this email address already exists. Please sign in instead."
            : isPhone
            ? "An account with this phone number already exists. Please sign in instead."
            : "An account with those details already exists.",
          field: isEmail ? "email" : isPhone ? "phone" : undefined,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
