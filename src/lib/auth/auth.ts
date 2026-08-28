import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";
import { authConfig } from "@/lib/auth/auth.config";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Determine if the identifier is a phone number (digits, spaces, +, -, parens)
 * or an email address.
 */
function isPhoneIdentifier(identifier: string): boolean {
  return /^[+\d\s().-]{9,15}$/.test(identifier.replace(/\s/g, ""));
}

/**
 * NextAuth v5 Node.js configuration (with database credentials provider).
 * Supports login by email OR phone number.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const identifier = typeof credentials.identifier === "string" ? credentials.identifier.trim() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!identifier || !password) {
          console.warn("[auth] Missing identifier or password in credentials:", { identifier: !!identifier, password: !!password });
          return null;
        }

        await connectDB();

        // Build the query: find by email OR phone (case-insensitive)
        const normalizedIdentifier = identifier.toLowerCase().trim();
        const query = isPhoneIdentifier(identifier)
          ? { phone: identifier.replace(/[\s-]/g, ""), isActive: true }
          : { email: { $regex: new RegExp(`^${normalizedIdentifier}$`, "i") }, isActive: true };

        const user = await User.findOne(query).select(
          "+passwordHash +loginAttempts +lockedUntil"
        );

        if (!user || !user.passwordHash) {
          console.warn("[auth] User not found for identifier:", identifier);
          return null;
        }

        // ── Account lockout check ──────────────────────────────────────────────
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 60_000
          );
          throw new Error(
            `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
          );
        }

        const isValid =
          (await bcrypt.compare(password, user.passwordHash)) ||
          (await bcrypt.compare(password.trim(), user.passwordHash));

        if (!isValid) {
          console.warn("[auth] Invalid password for user:", user.email || user.phone);
          // Increment failed attempts
          const newAttempts = (user.loginAttempts || 0) + 1;
          const updateData: Record<string, unknown> = {
            loginAttempts: newAttempts,
          };

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
          }

          await User.findByIdAndUpdate(user._id, { $set: updateData });
          return null;
        }

        // ── Admin Email Role Check ────────────────────────────────────────────
        const isAdminEmail = user.email?.toLowerCase().trim() === "khadijahabass273@gmail.com";
        const finalRole = isAdminEmail ? "ADMIN" : user.role;

        // ── Successful login ───────────────────────────────────────────────────
        // Reset attempts, update lastLogin, and ensure role is updated if admin
        await User.findByIdAndUpdate(user._id, {
          $set: {
            loginAttempts: 0,
            lockedUntil: undefined,
            lastLogin: new Date(),
            role: finalRole,
          },
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email ?? null,
          phone: user.phone ?? null,
          role: finalRole,
          image: user.avatar ?? null,
        };
      },
    }),
  ],
});
