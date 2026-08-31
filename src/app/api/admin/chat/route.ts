import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isGeminiConfigured } from "@/lib/gemini/client";
import {
  runGeminiAdminEngine,
  runLocalAdminEngine,
  AdminChatResponse,
} from "@/services/admin/admin-chat.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Messages array is required." },
        { status: 400 }
      );
    }

    // 1. Session verification (optional soft check for admin role)
    const session = await auth();
    // Allow authenticated users or admin session
    const userName = session?.user?.name || "Admin";

    // 2. Prepare Local Engine
    const localPromise = runLocalAdminEngine(messages);

    // 3. Try Gemini engine if configured
    if (isGeminiConfigured()) {
      try {
        const geminiWithTimeout = Promise.race<AdminChatResponse | null>([
          runGeminiAdminEngine(messages),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);

        const geminiResult = await geminiWithTimeout;
        if (geminiResult && geminiResult.reply) {
          if (process.env.NODE_ENV === "development") {
            console.log("[AdminChat] Using Gemini response");
          }
          return NextResponse.json({
            success: true,
            data: geminiResult,
          });
        }
      } catch (geminiErr) {
        console.warn("[AdminChat] Gemini engine error, falling back to local:", geminiErr);
      }
    }

    // 4. Return Local Smart Engine Result
    const localResult = await localPromise;
    if (process.env.NODE_ENV === "development") {
      console.log("[AdminChat] Using Local smart engine response");
    }

    return NextResponse.json({
      success: true,
      data: localResult,
    });
  } catch (error: any) {
    console.error("[api/admin/chat POST error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process admin copilot request",
        data: {
          reply:
            "I encountered a temporary problem processing your operations query. Please try again or open the target tab directly from the sidebar menu.",
          actionLinks: [
            { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard", primary: true },
            { label: "Orders", href: "/admin/orders", icon: "ShoppingBag" },
            { label: "Settings", href: "/admin/settings", icon: "Settings" },
          ],
        },
      },
      { status: 200 }
    );
  }
}
