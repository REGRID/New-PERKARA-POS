import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE_NAME, SessionPayload } from "@/lib/session";

/**
 * Extracts and verifies the session from the incoming NextRequest.
 * Checks both HTTP-Only Cookie and Authorization Header (Bearer token).
 */
export async function getAuthSession(req: NextRequest | Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. From NextRequest cookies
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    // 2. From standard Request cookie header
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match) token = match[1];
    }
  }

  // 3. Fallback to Authorization Bearer header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  return await verifySession(token);
}

/**
 * Guard function for API routes.
 * Ensures the requester has one of the allowed roles.
 * Returns null if allowed, or NextResponse (401/403) if disallowed.
 */
export async function requireRole(
  req: NextRequest | Request,
  allowedRoles: Array<"owner" | "admin" | "karyawan"> = ["admin"]
): Promise<{ errorResponse: NextResponse | null; session: SessionPayload | null }> {
  const session = await getAuthSession(req);

  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      ),
      session: null,
    };
  }

  // Owner implicitly has all Admin privileges
  const hasAccess = 
    allowedRoles.includes(session.role) ||
    (session.role === "owner" && allowedRoles.includes("admin"));

  if (!hasAccess) {
    return {
      errorResponse: NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk aksi ini." },
        { status: 403 }
      ),
      session,
    };
  }

  return { errorResponse: null, session };
}

// Backward compatibility helper for existing legacy callers
export function getAdminUserFromRequest(req: NextRequest): string {
  const customUserHeader = req.headers.get("x-admin-user");
  if (customUserHeader && customUserHeader.trim()) {
    return customUserHeader.trim().toLowerCase();
  }
  return "admin";
}
