import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "fp_session";

const PROTECTED_PREFIXES = [
  "/sell",
  "/messages",
  "/wishlist",
  "/settings",
  "/dashboard",
  "/my-listings",
  "/notifications",
  "/alerts",
  "/admin",
  "/onboarding",
];

/**
 * Edge middleware: cookie gate for protected app routes.
 * Full session + RBAC verification still happens in route handlers / layouts.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (needsAuth) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Policy", "app-level");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: [
    "/sell/:path*",
    "/sell",
    "/messages/:path*",
    "/messages",
    "/wishlist/:path*",
    "/wishlist",
    "/settings/:path*",
    "/settings",
    "/dashboard/:path*",
    "/dashboard",
    "/my-listings/:path*",
    "/my-listings",
    "/notifications/:path*",
    "/notifications",
    "/alerts/:path*",
    "/alerts",
    "/admin/:path*",
    "/onboarding",
  ],
};
