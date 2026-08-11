import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "fp_session";

/**
 * Edge middleware: lightweight gate for /admin routes.
 * Cookie presence is checked here; full session + RBAC verification
 * happens in admin layouts/pages via getCurrentUser / requirePermission.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Optional informational rate-limit headers (app-level limiter may override)
  response.headers.set("X-RateLimit-Policy", "app-level");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
