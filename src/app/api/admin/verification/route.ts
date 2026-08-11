import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { getVerificationPolicy, updateVerificationPolicy } from "@/services/verification/policy";

export async function GET() {
  try {
    await requireCurrentPermission("verification:review");
    const [policy, pending, verified, failed, reviews, recent] = await Promise.all([
      getVerificationPolicy(),
      prisma.identityVerification.count({ where: { status: "REVIEW_REQUIRED" } }),
      prisma.identityVerification.count({ where: { status: "VERIFIED" } }),
      prisma.identityVerification.count({ where: { status: "FAILED" } }),
      prisma.verificationReviewCase.count({
        where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
      }),
      prisma.identityVerification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          userId: true,
          status: true,
          provider: true,
          isDevelopment: true,
          riskClass: true,
          failureReasonCode: true,
          completedAt: true,
          createdAt: true,
          user: { select: { email: true, name: true, trustScore: true } },
        },
      }),
    ]);

    const total = verified + failed + pending;
    return ok({
      stats: {
        pendingReview: pending,
        verified,
        failed,
        openReviewCases: reviews,
        successRate: total ? Math.round((verified / total) * 100) : 0,
        failureRate: total ? Math.round((failed / total) * 100) : 0,
      },
      policy,
      recent,
      // Admins get metadata only — never raw biometrics
      note: "Biometric material is not exposed in this panel.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const policySchema = z.object({
  highValueListingInr: z.number().int().min(1000).optional(),
  enhancedValueListingInr: z.number().int().min(1000).optional(),
  requireIdentityAboveInr: z.number().int().min(1000).optional(),
  requireFaceAboveInr: z.number().int().min(1000).nullable().optional(),
  maxAttemptsPerHour: z.number().int().min(1).max(20).optional(),
  maxAttemptsPerDay: z.number().int().min(1).max(50).optional(),
  cooldownMinutesAfterFail: z.number().int().min(1).max(1440).optional(),
  lockMinutesAfterRepeatedFail: z.number().int().min(10).max(10080).optional(),
  failuresBeforeLock: z.number().int().min(1).max(20).optional(),
  sessionTtlMinutes: z.number().int().min(5).max(120).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireCurrentPermission("admin:access");
    const body = policySchema.parse(await jsonBody(request));
    const policy = await updateVerificationPolicy(body);
    return ok({ policy });
  } catch (error) {
    return handleRouteError(error);
  }
}
