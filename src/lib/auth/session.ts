import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";
import { prisma } from "@/lib/db";
import type { Role, User } from "@prisma/client";

export const SESSION_COOKIE = "fp_session";

export type SessionPayload = {
  sub: string;
  sid: string;
  role: Role;
  email: string;
};

export type SessionUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "displayName"
  | "avatarUrl"
  | "role"
  | "verificationLevel"
  | "trustScore"
  | "isBlocked"
  | "isSuspended"
>;

export type AppSession = {
  payload: SessionPayload;
  user: SessionUser;
  /** True when this login still needs face + liveness */
  requiresSigninFace: boolean;
  signinFaceVerifiedAt: Date | null;
};

function secretKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(options: {
  userId: string;
  role: Role;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  /**
   * When true, face+liveness is required for this session if
   * FACE_VERIFICATION_AT_SIGNIN is enabled (login, register, Google).
   */
  requireSigninFace?: boolean;
}): Promise<{ token: string; expiresAt: Date; requiresSigninFace: boolean }> {
  const expiresAt = new Date(
    Date.now() + env.AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  const needsFace =
    Boolean(options.requireSigninFace) && env.FACE_VERIFICATION_AT_SIGNIN;

  const session = await prisma.session.create({
    data: {
      userId: options.userId,
      tokenHash: hashToken(generateSessionToken()),
      expiresAt,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      deviceId: options.deviceId,
      // Skip challenge: mark verified immediately
      signinFaceVerifiedAt: needsFace ? null : new Date(),
    },
  });

  const jwt = await new SignJWT({
    sid: session.id,
    role: options.role,
    email: options.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(options.userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());

  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(jwt) },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token: jwt, expiresAt, requiresSigninFace: needsFace };
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    const sid = payload.sid as string | undefined;
    if (!sub || !sid) return null;

    const session = await prisma.session.findFirst({
      where: {
        id: sid,
        userId: sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) return null;

    const user = await prisma.user.findFirst({
      where: { id: sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        verificationLevel: true,
        trustScore: true,
        isBlocked: true,
        isSuspended: true,
      },
    });
    if (!user || user.isBlocked) return null;

    const requiresSigninFace =
      env.FACE_VERIFICATION_AT_SIGNIN && !session.signinFaceVerifiedAt;

    return {
      payload: {
        sub,
        sid,
        role: (payload.role as Role) ?? user.role,
        email: (payload.email as string) ?? user.email,
      },
      user,
      requiresSigninFace,
      signinFaceVerifiedAt: session.signinFaceVerifiedAt,
    };
  } catch {
    return null;
  }
}

export async function markSigninFaceVerified(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { signinFaceVerifiedAt: new Date() },
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      const sid = payload.sid as string | undefined;
      if (sid) {
        await prisma.session.updateMany({
          where: { id: sid, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      // ignore invalid token on logout
    }
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
