import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { writeVerificationAudit } from "@/services/verification/audit";
import { prisma } from "@/lib/db";

/**
 * Records a deletion/anonymization request. Does not wipe legally retained audit rows.
 */
export async function POST() {
  try {
    const user = await requireUser();

    await prisma.verificationConsent.updateMany({
      where: { userId: user.id, withdrawnAt: null },
      data: { withdrawnAt: new Date() },
    });

    // Clear capability timestamps; keep audit history
    await prisma.user.update({
      where: { id: user.id },
      data: {
        identityVerifiedAt: null,
        faceVerifiedAt: null,
        livenessVerifiedAt: null,
        requiresReverification: true,
      },
    });

    await prisma.identityVerification.updateMany({
      where: { userId: user.id, status: "VERIFIED" },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: "user_deletion_request",
        identityVerified: false,
        faceMatchPassed: false,
        livenessPassed: false,
      },
    });

    await writeVerificationAudit({
      userId: user.id,
      actorId: user.id,
      action: "verification_deletion_requested",
      entityType: "User",
      entityId: user.id,
      metadata: { note: "Capability flags cleared; audit retained per policy" },
    });

    return ok({ requested: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
