import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

/**
 * Edge-compatible NextAuth configuration.
 *
 * This file is imported in middleware.ts and MUST NOT import:
 * - mongoose
 * - bcryptjs
 * - any Node.js native or database modules
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role || "CUSTOMER";
        token.phone = (user as { phone?: string | null }).phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) || "CUSTOMER";
        session.user.phone = (token.phone as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || "kays_packs_production_auth_secret_2026",
};
