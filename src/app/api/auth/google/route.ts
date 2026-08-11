import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  createOAuthState,
  hashOAuthState,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", env.APP_URL),
    );
  }

  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"));
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const state = createOAuthState();
  const statePayload = `${hashOAuthState(state)}.${mode}`;

  const cookieStore = await cookies();
  const secure = env.NODE_ENV === "production";
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, statePayload, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set(GOOGLE_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
