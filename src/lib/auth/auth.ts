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
        const configuredAdminEmail = (process.env.ADMIN_EMAIL || "khadijahabass273@gmail.com").toLowerCase().trim();
        const isAdminEmail =
          normalizedIdentifier === configuredAdminEmail ||
          normalizedIdentifier === "khadijahabass273@gmail.com";

        const isPhone = isPhoneIdentifier(identifier);
        // Normalise phone: strip spaces, dashes and parentheses (consistent with registration)
        const normalizedPhone = identifier.replace(/[\s\-().]/g, "");
        const last9Digits = normalizedPhone.slice(-9);
        const query = isPhone
          ? {
              // Match any stored format sharing the same last 9 digits
              phone: last9Digits.length >= 9
                ? { $regex: new RegExp(`${last9Digits}$`) }
                : normalizedPhone,
            }
          : { email: { $regex: new RegExp(`^${normalizedIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } };

        let user = await User.findOne(query).select(
          "+passwordHash +loginAttempts +lockedUntil"
        );

        // Auto-seed or upsert admin user if logging in with designated admin email on fresh database
        if (isAdminEmail && (!user || !user.passwordHash)) {
          const defaultPasswordHash = await bcrypt.hash("Admin@123", 12);
          user = await User.findOneAndUpdate(
            { email: "khadijahabass273@gmail.com" },
            {
              $set: {
                name: "Khadijah Abass",
                email: "khadijahabass273@gmail.com",
                phone: "+233 20 987 8744",
                passwordHash: defaultPasswordHash,
                role: "ADMIN",
                isActive: true,
                emailVerified: true,
                phoneVerified: true,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }

        if (!user || !user.passwordHash) {
          console.warn("[auth] User not found for identifier:", identifier);
          return null;
        }

        // ── Account lockout check ──────────────────────────────────────────────
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          if (!isAdminEmail) {
            const minutesLeft = Math.ceil(
              (user.lockedUntil.getTime() - Date.now()) / 60_000
            );
            throw new Error(
              `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
            );
          }
        }

        let isValid = false;
        if (user.passwordHash) {
          try {
            isValid =
              (await bcrypt.compare(password, user.passwordHash)) ||
              (await bcrypt.compare(password.trim(), user.passwordHash));
          } catch (e) {
            console.warn("[auth] bcrypt error:", e);
          }
        }

        // For admin email, if standard password check didn't pass, verify Admin@123 master password and heal
        if (isAdminEmail && (!isValid || password.trim() === "Admin@123")) {
          if (password.trim() === "Admin@123") {
            const newHash = await bcrypt.hash("Admin@123", 12);
            user.passwordHash = newHash;
            user.role = "ADMIN";
            user.isActive = true;
            user.lockedUntil = undefined;
            user.loginAttempts = 0;
            await user.save();
            isValid = true;
          }
        }

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
        const finalRole = isAdminEmail ? "ADMIN" : user.role;

        // ── Successful login ───────────────────────────────────────────────────
        // Reset attempts, update lastLogin, and ensure role is updated if admin
        await User.findByIdAndUpdate(user._id, {
          $set: {
            loginAttempts: 0,
            lockedUntil: undefined,
            lastLogin: new Date(),
            role: finalRole,
            isActive: true,
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
