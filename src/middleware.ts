import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

// Admin-only page routes (Staff / Karyawan cannot access these)
const ADMIN_ROUTES = [
  "/",
  "/products",
  "/categories",
  "/inventory",
  "/purchases",
  "/discounts",
  "/expenses",
  "/employees",
  "/receipts",
  "/reports",
  "/settings",
  "/payment-methods",
];

// Pages accessible by both Admin and Staff (Karyawan)
const STAFF_ALLOWED_ROUTES = [
  "/pos",
  "/attendance",
  "/orders",
  "/tables",
  "/customers",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js system routes, and auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public QR Menu for customers without login
  if (pathname.startsWith("/qr-menu")) {
    return NextResponse.next();
  }

  // 3. Extract and verify session token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const isLoginPage = pathname === "/login";

  // 4. Handle Unauthenticated Requests
  if (!session) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    // Redirect unauthenticated user to /login
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle Authenticated User visiting /login
  if (isLoginPage) {
    const targetUrl = (session.role === "admin" || session.role === "owner")
      ? new URL("/", request.url)
      : new URL("/pos", request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 6. Handle Role-Based Access Control (Karyawan / Cashier)
  if (session.role === "karyawan") {
    // Check if the path is an admin-restricted route
    const isAdminOnly = ADMIN_ROUTES.some((route) =>
      route === "/" ? pathname === "/" : pathname.startsWith(route)
    );

    if (isAdminOnly) {
      // Redirect staff away from admin ERP pages directly to POS
      const posUrl = new URL("/pos", request.url);
      return NextResponse.redirect(posUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
