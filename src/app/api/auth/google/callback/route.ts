import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import {
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  hashOAuthState,
  isGoogleAuthConfigured,
} from "@/lib/auth/google";
import { logger } from "@/lib/logger";

function redirectWithError(code: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, env.APP_URL));
}

function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return redirectWithError("google_not_configured");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectWithError(oauthError === "access_denied" ? "google_denied" : "google_failed");
  }
  if (!code || !state) {
    return redirectWithError("google_invalid");
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const nextPath = safeNextPath(cookieStore.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value);

  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(GOOGLE_OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });

  if (!storedState) {
    return redirectWithError("google_state_missing");
  }

  const [storedHash] = storedState.split(".");
  if (!storedHash || storedHash !== hashOAuthState(state)) {
    return redirectWithError("google_state_mismatch");
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);
    const email = profile.email.toLowerCase().trim();
    const name = profile.name || profile.given_name || email.split("@")[0];
    const avatarUrl = profile.picture || null;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email }],
        deletedAt: null,
      },
    });

    if (user?.isBlocked) {
      return redirectWithError("account_blocked");
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId: profile.id,
          authProvider: "google",
          name,
          displayName: name,
          avatarUrl,
          emailVerified: profile.verified_email ? new Date() : new Date(),
          verificationLevel: "EMAIL_VERIFIED",
          profile: { create: {} },
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? profile.id,
          authProvider: user.passwordHash ? user.authProvider : "google",
          name: user.name || name,
          displayName: user.displayName || name,
          avatarUrl: user.avatarUrl || avatarUrl,
          emailVerified: user.emailVerified ?? new Date(),
          verificationLevel:
            user.verificationLevel === "BASIC" ? "EMAIL_VERIFIED" : user.verificationLevel,
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });
    }

    await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      requireSigninFace: true,
    });

    const faceNext = user.onboardingDone ? nextPath : "/onboarding";
    if (env.FACE_VERIFICATION_AT_SIGNIN) {
      return NextResponse.redirect(
        new URL(`/login/face?next=${encodeURIComponent(faceNext)}`, env.APP_URL),
      );
    }
    return NextResponse.redirect(new URL(faceNext, env.APP_URL));
  } catch (error) {
    logger.error("Google OAuth callback failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return redirectWithError("google_failed");
  }
}
