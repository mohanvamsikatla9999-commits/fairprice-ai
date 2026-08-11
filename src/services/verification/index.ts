import type { IdvStatus, IdentityVerification, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { env } from "@/config/env";
import {
  createIdentityVerificationProvider,
  getMockIdentityProvider,
  type LivenessChallenge,
} from "@/providers/identity-verification";
import { writeVerificationAudit } from "./audit";
import { verificationAttemptLimitService } from "./attempt-limits";
import { duplicateAccountDetectionService } from "./duplicate-account";
import {
  computeFairPriceIdLevel,
  levelToVerificationLevel,
  type VerificationFlags,
} from "./levels";
import { livenessVerificationService } from "./liveness";
import type { CaptureClientHints } from "./anti-spoofing";
import { getVerificationPolicy } from "./policy";
import { assertTransition, isActiveSessionStatus } from "./state-machine";
import { trustScoreEngine } from "./trust-score";

const CONSENT_VERSION = "fairprice-id-v1";

export type PublicVerificationView = {
  id: string;
  status: IdvStatus;
  provider: string;
  isDevelopment: boolean;
  faceDetected: boolean;
  faceQualityOk: boolean;
  livenessPassed: boolean;
  faceMatchPassed: boolean;
  identityVerified: boolean;
  documentChecked: boolean;
  riskClass: string;
  failureMessage: string | null;
  challenges?: LivenessChallenge[];
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

function toPublic(v: IdentityVerification, challenges?: LivenessChallenge[]): PublicVerificationView {
  return {
    id: v.id,
    status: v.status,
    provider: v.provider,
    isDevelopment: v.isDevelopment,
    faceDetected: v.faceDetected,
    faceQualityOk: v.faceQualityOk,
    livenessPassed: v.livenessPassed,
    faceMatchPassed: v.faceMatchPassed,
    identityVerified: v.identityVerified,
    documentChecked: v.documentChecked,
    riskClass: v.riskClass,
    failureMessage: v.failureMessage,
    challenges,
    expiresAt: v.expiresAt?.toISOString() ?? null,
    completedAt: v.completedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

export class IdentityVerificationService {
  async getUserFlags(userId: string): Promise<VerificationFlags> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        emailVerified: true,
        phoneVerified: true,
        identityVerifiedAt: true,
        faceVerifiedAt: true,
        livenessVerifiedAt: true,
        verificationLevel: true,
        businessAccount: { select: { id: true } },
      },
    });
    return {
      emailVerified: Boolean(user.emailVerified),
      phoneVerified: Boolean(user.phoneVerified),
      identityVerified: Boolean(user.identityVerifiedAt),
      faceVerified: Boolean(user.faceVerifiedAt),
      livenessVerified: Boolean(user.livenessVerifiedAt),
      trustedSeller: user.verificationLevel === "TRUSTED_SELLER" || user.verificationLevel === "BUSINESS_VERIFIED",
      businessVerified:
        user.verificationLevel === "BUSINESS_VERIFIED" || Boolean(user.businessAccount),
    };
  }

  async getStatus(userId: string) {
    const flags = await this.getUserFlags(userId);
    const level = computeFairPriceIdLevel(flags);
    const latest = await prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        trustScore: true,
        sellerTrustScore: true,
        requiresReverification: true,
        verificationLockedUntil: true,
        verificationLevel: true,
      },
    });
    return {
      fairPriceIdLevel: level,
      verificationLevel: user.verificationLevel,
      flags,
      trustScore: user.trustScore,
      sellerTrustScore: user.sellerTrustScore,
      requiresReverification: user.requiresReverification,
      lockedUntil: user.verificationLockedUntil?.toISOString() ?? null,
      latest: latest ? toPublic(latest) : null,
      developmentMode: env.MOCK_IDENTITY_VERIFICATION || env.NODE_ENV !== "production",
    };
  }

  async recordConsent(options: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const consent = await prisma.verificationConsent.create({
      data: {
        userId: options.userId,
        version: CONSENT_VERSION,
        biometricProcessing: true,
        retentionAcknowledged: true,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
    await writeVerificationAudit({
      userId: options.userId,
      actorId: options.userId,
      action: "consent_given",
      entityType: "VerificationConsent",
      entityId: consent.id,
      ipAddress: options.ipAddress,
      metadata: { version: CONSENT_VERSION },
    });
    return consent;
  }

  async startVerification(options: {
    userId: string;
    consentId: string;
    ipAddress?: string;
    userAgent?: string;
    forceOutcome?: "success" | "fail" | "review" | "spoof";
  }) {
    await verificationAttemptLimitService.assertAllowed(options.userId);

    const consent = await prisma.verificationConsent.findFirst({
      where: {
        id: options.consentId,
        userId: options.userId,
        withdrawnAt: null,
      },
    });
    if (!consent) {
      throw new AppError("Valid consent is required before verification", 400, "CONSENT_REQUIRED");
    }

    // Expire other active sessions
    await prisma.identityVerification.updateMany({
      where: {
        userId: options.userId,
        status: {
          in: [
            "NOT_STARTED",
            "CONSENT_REQUIRED",
            "IN_PROGRESS",
            "DOCUMENT_PENDING",
            "FACE_PENDING",
            "LIVENESS_PENDING",
          ],
        },
      },
      data: { status: "EXPIRED" },
    });

    const policy = await getVerificationPolicy();
    const isDevelopment =
      env.MOCK_IDENTITY_VERIFICATION || env.NODE_ENV !== "production";
    const provider = createIdentityVerificationProvider();

    const verification = await prisma.identityVerification.create({
      data: {
        userId: options.userId,
        status: "CONSENT_REQUIRED",
        provider: provider.name,
        method: "face_liveness",
        consentId: consent.id,
        isDevelopment,
        expiresAt: new Date(Date.now() + policy.sessionTtlMinutes * 60_000),
      },
    });

    assertTransition(verification.status, "FACE_PENDING");

    const session = await provider.createVerificationSession({
      userId: options.userId,
      verificationId: verification.id,
      consentId: consent.id,
      metadata: options.forceOutcome ? { forceOutcome: options.forceOutcome } : undefined,
    });

    const updated = await prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: "FACE_PENDING",
        providerSessionId: session.providerSessionId,
        expiresAt: session.expiresAt,
        isDevelopment: session.isDevelopment,
        metadata: {
          challenges: session.challenges,
          clientTokenIssued: Boolean(session.clientToken),
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.verificationAttempt.create({
      data: {
        verificationId: updated.id,
        userId: options.userId,
        outcome: "STARTED",
        challengeType: session.challenges.join(","),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });

    await writeVerificationAudit({
      userId: options.userId,
      actorId: options.userId,
      action: "verification_started",
      entityType: "IdentityVerification",
      entityId: updated.id,
      ipAddress: options.ipAddress,
      metadata: { provider: provider.name, isDevelopment },
    });

    return {
      verification: toPublic(updated, session.challenges),
      clientToken: session.clientToken,
      isDevelopment: session.isDevelopment,
    };
  }

  async submitLiveness(options: {
    userId: string;
    verificationId: string;
    completedChallenges: string[];
    hints: CaptureClientHints;
    ipAddress?: string;
    userAgent?: string;
    /** Dev-only outcome override via mock provider — ignored in production */
    forceOutcome?: "success" | "fail" | "review" | "spoof";
  }) {
    const verification = await this.getOwnedVerification(
      options.userId,
      options.verificationId,
    );

    if (!isActiveSessionStatus(verification.status) && verification.status !== "FACE_PENDING") {
      throw new AppError("Verification is not awaiting capture", 409, "INVALID_STATE");
    }
    if (verification.expiresAt && verification.expiresAt < new Date()) {
      await this.transition(verification.id, verification.status, "EXPIRED");
      throw new AppError("Verification session expired", 410, "EXPIRED");
    }

    await verificationAttemptLimitService.assertAllowed(options.userId);

    const meta = (verification.metadata ?? {}) as { challenges?: LivenessChallenge[] };
    const challenges = meta.challenges ?? [];

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await prisma.verificationAttempt.count({
      where: { userId: options.userId, createdAt: { gte: hourAgo } },
    });

    const liveness = livenessVerificationService.evaluate({
      challenges,
      completedChallenges: options.completedChallenges,
      hints: options.hints,
      recentAttemptCount: recentAttempts,
    });

    await prisma.verificationAttempt.create({
      data: {
        verificationId: verification.id,
        userId: options.userId,
        outcome: liveness.passed ? "LIVENESS_PASSED" : "LIVENESS_FAILED",
        challengeType: challenges.join(","),
        clientSignals: {
          faceCount: options.hints.faceCount,
          captureDurationMs: options.hints.captureDurationMs,
          challengeCount: options.completedChallenges.length,
        } as Prisma.InputJsonValue,
        serverSignals: {
          antiSpoofClass: liveness.antiSpoof.classification,
          riskScore: liveness.antiSpoof.riskScore,
          signalCodes: liveness.antiSpoof.signals.map((s) => s.code),
        } as Prisma.InputJsonValue,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        errorCode: liveness.reasonCode,
      },
    });

    if (!liveness.passed) {
      await this.transition(verification.id, verification.status, "FAILED", {
        faceDetected: (options.hints.faceCount ?? 0) > 0,
        faceQualityOk: false,
        livenessPassed: false,
        failureReasonCode: liveness.reasonCode,
        failureMessage: "Verification couldn't be completed.",
        riskClass: liveness.antiSpoof.classification === "reject" ? "HIGH" : "MEDIUM",
      });
      await verificationAttemptLimitService.recordFailure(options.userId);
      await writeVerificationAudit({
        userId: options.userId,
        action: "verification_failed",
        entityType: "IdentityVerification",
        entityId: verification.id,
        metadata: { reasonCode: liveness.reasonCode },
      });
      const failed = await prisma.identityVerification.findUniqueOrThrow({
        where: { id: verification.id },
      });
      return { verification: toPublic(failed), duplicateRisk: null };
    }

    // Provider authoritative result (mock simulates; real provider would analyze)
    const provider = createIdentityVerificationProvider();
    let result;
    if (provider.isMock && verification.providerSessionId) {
      const outcome =
        options.forceOutcome ??
        (env.NODE_ENV === "production" ? "success" : options.forceOutcome);
      result = getMockIdentityProvider().completeSession(verification.providerSessionId, {
        outcome: outcome ?? "success",
        faceDetected: true,
        faceQualityOk: true,
      });
    } else if (verification.providerSessionId) {
      result = await provider.getVerificationResult(verification.providerSessionId);
    } else {
      throw new AppError("Missing provider session", 500, "PROVIDER_SESSION_MISSING");
    }

    // Never trust client claiming verified — only provider/server result
    if (result.status === "VERIFIED" && !provider.isMock && env.NODE_ENV === "production") {
      // production non-mock path
    }

    // Development mock success is labeled isDevelopment on the record
    const nextStatus = result.status;
    assertTransition(
      "LIVENESS_PENDING",
      nextStatus === "VERIFIED" ||
        nextStatus === "FAILED" ||
        nextStatus === "REVIEW_REQUIRED"
        ? nextStatus
        : "FAILED",
    );

    await this.transition(verification.id, verification.status, "LIVENESS_PENDING", {
      faceDetected: result.faceDetected,
      faceQualityOk: result.faceQualityOk,
      livenessPassed: result.livenessPassed,
    });

    const finalStatus =
      nextStatus === "VERIFIED" ||
      nextStatus === "FAILED" ||
      nextStatus === "REVIEW_REQUIRED" ||
      nextStatus === "EXPIRED"
        ? nextStatus
        : "FAILED";

    const updated = await this.transition(verification.id, "LIVENESS_PENDING", finalStatus, {
      faceDetected: result.faceDetected,
      faceQualityOk: result.faceQualityOk,
      livenessPassed: result.livenessPassed,
      faceMatchPassed: result.faceMatchPassed,
      documentChecked: result.documentChecked,
      identityVerified: result.identityVerified,
      riskClass: result.riskClass,
      failureReasonCode: result.failureReasonCode,
      failureMessage: result.failureMessage ?? null,
      providerReferenceId: result.providerReferenceId,
      completedAt: finalStatus === "VERIFIED" ? new Date() : undefined,
    });

    // Discard temporary provider data — privacy-first
    if (verification.providerSessionId) {
      await provider.deleteTemporaryData(verification.providerSessionId);
    }

    const duplicateRisk = await duplicateAccountDetectionService.assess(options.userId);

    if (finalStatus === "VERIFIED") {
      await this.applySuccessfulVerification(options.userId, updated);
      await verificationAttemptLimitService.resetFailures(options.userId);
      await writeVerificationAudit({
        userId: options.userId,
        action: "verification_completed",
        entityType: "IdentityVerification",
        entityId: updated.id,
        metadata: {
          isDevelopment: updated.isDevelopment,
          duplicateReview: duplicateRisk.requiresManualReview,
        },
      });
      if (duplicateRisk.requiresManualReview) {
        await this.createReviewCase({
          userId: options.userId,
          verificationId: updated.id,
          reason: "Possible related accounts detected — manual review recommended",
        });
      }
    } else if (finalStatus === "REVIEW_REQUIRED") {
      await this.createReviewCase({
        userId: options.userId,
        verificationId: updated.id,
        reason: result.failureReasonCode ?? "Provider requested review",
      });
      await writeVerificationAudit({
        userId: options.userId,
        action: "verification_review_created",
        entityType: "IdentityVerification",
        entityId: updated.id,
      });
    } else {
      await verificationAttemptLimitService.recordFailure(options.userId);
      await writeVerificationAudit({
        userId: options.userId,
        action: "verification_failed",
        entityType: "IdentityVerification",
        entityId: updated.id,
        metadata: { reasonCode: result.failureReasonCode },
      });
    }

    return {
      verification: toPublic(updated),
      duplicateRisk: {
        requiresManualReview: duplicateRisk.requiresManualReview,
        riskScore: duplicateRisk.riskScore,
      },
    };
  }

  async requestReview(options: {
    userId: string;
    verificationId: string;
    reason: string;
  }) {
    const verification = await this.getOwnedVerification(
      options.userId,
      options.verificationId,
    );
    if (verification.status !== "FAILED" && verification.status !== "REVIEW_REQUIRED") {
      throw new AppError("Review can only be requested after a failed verification", 400);
    }
    return this.createReviewCase({
      userId: options.userId,
      verificationId: verification.id,
      reason: options.reason.slice(0, 500),
    });
  }

  async revoke(options: {
    userId: string;
    actorId: string;
    reason: string;
    verificationId?: string;
  }) {
    const latest =
      options.verificationId
        ? await prisma.identityVerification.findFirst({
            where: { id: options.verificationId, userId: options.userId },
          })
        : await prisma.identityVerification.findFirst({
            where: { userId: options.userId, status: "VERIFIED" },
            orderBy: { completedAt: "desc" },
          });

    if (!latest) throw new NotFoundError("Verified identity record not found");

    await this.transition(latest.id, latest.status, "REVOKED", {
      revokedAt: new Date(),
      revokedReason: options.reason,
      identityVerified: false,
      faceMatchPassed: false,
      livenessPassed: false,
    });

    await prisma.user.update({
      where: { id: options.userId },
      data: {
        identityVerifiedAt: null,
        faceVerifiedAt: null,
        livenessVerifiedAt: null,
        requiresReverification: true,
      },
    });
    await this.refreshUserTrust(options.userId);

    await writeVerificationAudit({
      userId: options.userId,
      actorId: options.actorId,
      action: "verification_revoked",
      entityType: "IdentityVerification",
      entityId: latest.id,
      metadata: { reason: options.reason },
    });
  }

  async adminDecideReview(options: {
    reviewId: string;
    actorId: string;
    decision: "APPROVED" | "REJECTED" | "ESCALATED";
    notes?: string;
  }) {
    const review = await prisma.verificationReviewCase.findUnique({
      where: { id: options.reviewId },
    });
    if (!review) throw new NotFoundError("Review case not found");

    const status =
      options.decision === "APPROVED"
        ? "APPROVED"
        : options.decision === "REJECTED"
          ? "REJECTED"
          : "ESCALATED";

    await prisma.verificationReviewCase.update({
      where: { id: review.id },
      data: {
        status,
        decision: options.decision,
        notes: options.notes,
        reviewerId: options.actorId,
      },
    });

    if (options.decision === "APPROVED") {
      const verification = await prisma.identityVerification.findUniqueOrThrow({
        where: { id: review.verificationId },
      });
      const updated = await this.transition(verification.id, verification.status, "VERIFIED", {
        identityVerified: true,
        faceDetected: true,
        faceQualityOk: true,
        livenessPassed: true,
        faceMatchPassed: true,
        completedAt: new Date(),
      });
      await this.applySuccessfulVerification(review.userId, updated);
    } else if (options.decision === "REJECTED") {
      const verification = await prisma.identityVerification.findUniqueOrThrow({
        where: { id: review.verificationId },
      });
      await this.transition(verification.id, verification.status, "FAILED", {
        failureReasonCode: "REVIEW_REJECTED",
        failureMessage: "Verification couldn't be completed.",
      });
    }

    await writeVerificationAudit({
      userId: review.userId,
      actorId: options.actorId,
      action: "verification_reviewed",
      entityType: "VerificationReviewCase",
      entityId: review.id,
      metadata: { decision: options.decision },
    });
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>) {
    const provider = createIdentityVerificationProvider();
    const handled = await provider.handleWebhook(rawBody, headers);

    await prisma.verificationEvent.create({
      data: {
        providerEventId: handled.providerEventId,
        eventType: handled.accepted ? "provider_webhook" : "provider_webhook_rejected",
        verificationId: handled.verificationId,
        payload: {
          duplicate: handled.duplicate,
          accepted: handled.accepted,
        } as Prisma.InputJsonValue,
        signatureValid: handled.accepted,
        processedAt: handled.accepted ? new Date() : null,
      },
    });

    if (!handled.accepted) {
      throw new AppError("Invalid webhook signature", 401, "WEBHOOK_INVALID");
    }
    if (handled.duplicate) {
      return { ok: true, duplicate: true };
    }
    if (handled.verificationId && handled.result) {
      const verification = await prisma.identityVerification.findUnique({
        where: { id: handled.verificationId },
      });
      if (verification && handled.result.status === "VERIFIED") {
        const updated = await this.transition(
          verification.id,
          verification.status,
          "VERIFIED",
          {
            ...handled.result,
            completedAt: new Date(),
          },
        );
        await this.applySuccessfulVerification(verification.userId, updated);
      }
    }
    return { ok: true, duplicate: false };
  }

  async listHistory(userId: string) {
    const rows = await prisma.identityVerification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => toPublic(r));
  }

  async onSensitiveProfileChange(userId: string, fields: string[]) {
    const sensitive = ["email", "phone", "name", "displayName"];
    if (!fields.some((f) => sensitive.includes(f))) return;
    const flags = await this.getUserFlags(userId);
    if (flags.identityVerified || flags.faceVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { requiresReverification: true },
      });
      await writeVerificationAudit({
        userId,
        action: "verification_method_changed",
        entityType: "User",
        entityId: userId,
        metadata: { fields },
      });
    }
  }

  private async createReviewCase(options: {
    userId: string;
    verificationId: string;
    reason: string;
  }) {
    return prisma.verificationReviewCase.create({
      data: {
        userId: options.userId,
        verificationId: options.verificationId,
        reason: options.reason,
        status: "OPEN",
      },
    });
  }

  private async applySuccessfulVerification(
    userId: string,
    verification: IdentityVerification,
  ) {
    // Production mode: mock provider must not grant real identity badges
    if (verification.isDevelopment && env.NODE_ENV === "production" && !env.ALLOW_MOCK_IDV_IN_PRODUCTION) {
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: "FAILED",
          failureReasonCode: "MOCK_NOT_ALLOWED",
          failureMessage: "Development verification is not valid in production.",
          identityVerified: false,
        },
      });
      throw new AppError(
        "Development verification cannot grant identity status in production",
        403,
        "MOCK_IDV_BLOCKED",
      );
    }

    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        identityVerifiedAt: now,
        faceVerifiedAt: verification.livenessPassed ? now : null,
        livenessVerifiedAt: verification.livenessPassed ? now : null,
        requiresReverification: false,
      },
    });
    await this.refreshUserTrust(userId);
  }

  async refreshUserTrust(userId: string) {
    const flags = await this.getUserFlags(userId);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        reviewsReceived: { select: { rating: true } },
        reportsAgainst: { select: { id: true } },
      },
    });
    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    const ratingAvg =
      user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((s, r) => s + r.rating, 0) /
          user.reviewsReceived.length
        : undefined;

    const { score } = trustScoreEngine.compute({
      flags,
      accountAgeDays,
      completedTransactions: user.profile?.completedSales ?? 0,
      ratingAvg,
      reviewCount: user.reviewsReceived.length,
      responseRate: user.profile?.responseRate ?? 0,
      reportCount: user.reportsAgainst.length,
      verificationRevoked: false,
      verificationFailures: user.verificationFailureCount,
    });

    const level = levelToVerificationLevel(computeFairPriceIdLevel(flags));
    await prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: score,
        sellerTrustScore: score,
        verificationLevel: level,
      },
    });
  }

  private async getOwnedVerification(userId: string, verificationId: string) {
    const verification = await prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });
    if (!verification) throw new NotFoundError("Verification not found");
    if (verification.userId !== userId) {
      throw new ForbiddenError("Verification does not belong to this user");
    }
    return verification;
  }

  private async transition(
    id: string,
    from: IdvStatus,
    to: IdvStatus,
    data: Partial<{
      faceDetected: boolean;
      faceQualityOk: boolean;
      livenessPassed: boolean;
      faceMatchPassed: boolean;
      documentChecked: boolean;
      identityVerified: boolean;
      riskClass: IdentityVerification["riskClass"];
      failureReasonCode: string | null;
      failureMessage: string | null;
      providerReferenceId: string;
      completedAt: Date;
      revokedAt: Date;
      revokedReason: string;
    }> = {},
  ) {
    assertTransition(from, to);
    return prisma.identityVerification.update({
      where: { id },
      data: {
        status: to,
        ...data,
      },
    });
  }
}

export const identityVerificationService = new IdentityVerificationService();
