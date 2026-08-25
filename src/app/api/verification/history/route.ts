import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    const user = await requireUser();

    const [verifications, consents] = await Promise.all([
      prisma.identityVerification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          provider: true,
          method: true,
          riskClass: true,
          isDevelopment: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.verificationConsent.findMany({
        where: { userId: user.id },
        orderBy: { consentedAt: "desc" },
        take: 10,
        select: {
          id: true,
          version: true,
          consentedAt: true,
          withdrawnAt: true,
          biometricProcessing: true,
          retentionAcknowledged: true,
        },
      }),
    ]);

    return ok({ verifications, consents });
  } catch (error) {
    return handleRouteError(error);
  }
}
