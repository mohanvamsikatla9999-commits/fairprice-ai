import type { Role } from "@prisma/client";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/api/errors";
import {
  getSession,
  type SessionPayload,
  type SessionUser,
} from "@/lib/auth/session";
import {
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  type Permission,
} from "@/lib/auth/rbac";

export type CurrentUser = SessionUser & {
  session: SessionPayload;
  requiresSigninFace: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  return {
    ...session.user,
    session: session.payload,
    requiresSigninFace: session.requiresSigninFace,
  };
}

/**
 * Authenticated user. By default blocks until auth face challenge passes.
 * Pass { allowPendingFace: true } for face-challenge / logout / me endpoints.
 */
export async function requireUser(options?: {
  allowPendingFace?: boolean;
}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (user.isBlocked) throw new ForbiddenError("Account is blocked");
  if (user.requiresSigninFace && !options?.allowPendingFace) {
    throw new AppError(
      "Face verification required to continue",
      403,
      "FACE_CHALLENGE_REQUIRED",
      { redirect: "/login/face" },
    );
  }
  return user;
}

export async function requireCurrentRole(required: Role | Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  requireRole(user.role, required);
  return user;
}

export async function requireCurrentPermission(
  permission: Permission,
): Promise<CurrentUser> {
  const user = await requireUser();
  requirePermission(user.role, permission);
  return user;
}

export async function getOptionalUser(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export { hasRole, hasPermission };
