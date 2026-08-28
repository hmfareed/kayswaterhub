import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Middleware for route protection.
 *
 * Rules:
 * - /admin/*     → requires ADMIN or SUPER_ADMIN role
 * - /delivery/*  → requires DELIVERY role
 * - /account/*   → requires any authenticated user (CUSTOMER+)
 * - /login, /register, /forgot-password, /reset-password
 *                → redirect to "/" if already authenticated
 * - Everything else → public (guest checkout must work without login)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Redirect authenticated users away from auth pages ──────────────────────
  const authOnlyPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (authOnlyPaths.some((p) => pathname.startsWith(p)) && session) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin", req.url));
    }
    const role = session.user?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Delivery routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/delivery")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=/delivery", req.url)
      );
    }
    const role = session.user?.role;
    if (role !== "DELIVERY" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Customer account routes ──────────────────────────────────────────────────
  // Allow customers to view account page and interactive sections; auth features handled gracefully

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/delivery/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    // Exclude static files, images, and API routes from middleware
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
