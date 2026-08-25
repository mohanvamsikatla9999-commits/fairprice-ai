import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "ESCALATED"]),
  notes: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  try {
    const reviewer = await requireCurrentPermission("verification:review");
    const { id } = await context.params;
    const body = schema.parse(await jsonBody(request));

    const reviewCase = await prisma.verificationReviewCase.findUniqueOrThrow({
      where: { id },
      include: { verification: true },
    });

    // Update the review case
    await prisma.verificationReviewCase.update({
      where: { id },
      data: {
        status: body.decision === "ESCALATED" ? "ESCALATED" : "CLOSED",
        decision: body.decision,
        notes: body.notes,
        reviewerId: reviewer.id,
        updatedAt: new Date(),
      },
    });

    // Apply the decision to the underlying verification
    if (body.decision === "APPROVED") {
      await prisma.identityVerification.update({
        where: { id: reviewCase.verificationId },
        data: { status: "VERIFIED", identityVerified: true, completedAt: new Date() },
      });
      // Upgrade user verification level
      await prisma.user.update({
        where: { id: reviewCase.userId },
        data: {
          verificationLevel: "IDENTITY_VERIFIED",
          identityVerifiedAt: new Date(),
        },
      });
    } else if (body.decision === "REJECTED") {
      await prisma.identityVerification.update({
        where: { id: reviewCase.verificationId },
        data: { status: "FAILED", failureReasonCode: "MANUAL_REJECT", failureMessage: body.notes },
      });
    }

    // Log the audit action
    await prisma.verificationAuditLog.create({
      data: {
        userId: reviewCase.userId,
        actorId: reviewer.id,
        action: `REVIEW_${body.decision}`,
        entityType: "VerificationReviewCase",
        entityId: id,
        metadata: { decision: body.decision, notes: body.notes },
      },
    });

    return ok({ id, decision: body.decision });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(_request: Request, context: Ctx) {
  try {
    await requireCurrentPermission("verification:review");
    const { id } = await context.params;
    const reviewCase = await prisma.verificationReviewCase.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, trustScore: true } },
        verification: true,
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
    return ok({ case: reviewCase });
  } catch (error) {
    return handleRouteError(error);
  }
}
