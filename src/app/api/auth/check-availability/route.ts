import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/auth/rate-limit";

/**
 * Normalises a raw phone string to digits + optional leading '+'.
 * Strips spaces, dashes, parentheses and dots.
 */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

/**
 * GET /api/auth/check-availability?email=...
 * GET /api/auth/check-availability?phone=...
 *
 * Returns { available: boolean } — used by the register form on blur
 * to give instant "already taken" feedback without waiting for submit.
 */
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Light rate-limit: 20 checks per minute per IP
  const rl = checkRateLimit(`check-avail:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ available: true }, { status: 429 }); // fail open silently
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const phone = searchParams.get("phone")?.trim();

  if (!email && !phone) {
    return NextResponse.json({ error: "email or phone required" }, { status: 400 });
  }

  await connectDB();

  if (email) {
    const exists = await User.exists({ email });
    return NextResponse.json(
      { available: !exists },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (phone) {
    const cleaned = normalizePhone(phone);
    if (cleaned.length < 9) {
      return NextResponse.json({ available: true });
    }
    const last9 = cleaned.slice(-9);
    // Match all known formats: 0XXXXXXXXX, +233XXXXXXXXX, 233XXXXXXXXX
    const exists = await User.exists({
      phone: { $regex: new RegExp(`${last9}$`) },
    });
    return NextResponse.json(
      { available: !exists },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
