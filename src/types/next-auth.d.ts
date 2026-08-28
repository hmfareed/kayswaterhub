import type { UserRole } from "@/types";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    phone?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      phone?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: string | null;
  }
}
