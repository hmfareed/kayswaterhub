import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Standard API response helpers.
 * Use these in all Route Handlers for consistent response shape.
 */

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(error: string): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

export function unauthorized(error = "Unauthorized"): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbidden(error = "Forbidden"): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function notFound(error = "Not found"): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function serverError(error = "Internal server error"): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

/** Wrap any async route handler to catch unhandled errors */
export function withErrorHandler(
  handler: (req: Request, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: Request, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error("[API Error]", err);
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return serverError(message);
    }
  };
}
