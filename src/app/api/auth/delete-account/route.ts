/**
 * Account deletion (soft-delete + anonymization).
 * Marks the user as deleted, revokes all sessions, and scrubs PII.
 * Hard deletion of audit logs is deferred per legal retention policy.
 */
import { requireUser } from "@/lib/auth/middleware";
import { destroySession, revokeAllUserSessions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { verifyPassword } from "@/lib/auth/password";
import { ValidationError, UnauthorizedError } from "@/lib/api/errors";
import { z } from "zod";

const schema = z.object({
  password: z.string().optional(), // required if account has a password
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const raw = await jsonBody(request);
    const body = schema.parse(raw);

    // If user has a password, verify it before deletion
    const fullUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true, email: true },
    });

    if (fullUser.passwordHash) {
      if (!body.password) {
        throw new ValidationError("Please enter your password to confirm deletion.");
      }
      const valid = await verifyPassword(body.password, fullUser.passwordHash);
      if (!valid) throw new UnauthorizedError("Incorrect password.");
    }

    const anonymizedEmail = `deleted_${user.id}@deleted.fairprice.local`;

    // Soft-delete: anonymize PII, mark deletedAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        email: anonymizedEmail,
        name: "Deleted User",
        displayName: "Deleted User",
        phone: null,
        avatarUrl: null,
        bio: null,
        passwordHash: null,
        googleId: null,
        isBlocked: true,
      },
    });

    // Revoke all sessions
    await revokeAllUserSessions(user.id);

    // Clear the current session cookie
    await destroySession();

    // Soft-delete all active listings
    await prisma.listing.updateMany({
      where: { sellerId: user.id, deletedAt: null },
      data: { deletedAt: new Date(), status: "DELETED" },
    });

    // Audit log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETED",
        entityType: "User",
        entityId: user.id,
        metadata: { selfDeleted: true },
      },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
