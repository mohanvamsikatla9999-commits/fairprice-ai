import type { ModerationDecision, ModerationStatus, RiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/errors";
import { fraudRiskEngine } from "@/services/fraud";

export class ModerationService {
  async enqueueListing(listingId: string, reason?: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundError("Listing not found");

    const assessment = fraudRiskEngine.assess({
      askingPriceInr: listing.priceInr,
      trustScore: undefined,
      listingAgeHours: 0,
    });

    return prisma.moderationCase.create({
      data: {
        listingId,
        riskLevel: assessment.level,
        status: "PENDING",
        reason: reason ?? assessment.summary,
      },
    });
  }

  async decide(options: {
    caseId: string;
    assigneeId: string;
    decision: ModerationDecision;
    status?: ModerationStatus;
    notes?: string;
  }) {
    const modCase = await prisma.moderationCase.findUnique({
      where: { id: options.caseId },
    });
    if (!modCase) throw new NotFoundError("Moderation case not found");

    const updated = await prisma.moderationCase.update({
      where: { id: options.caseId },
      data: {
        assigneeId: options.assigneeId,
        decision: options.decision,
        status: options.status ?? (options.decision === "ALLOW" ? "APPROVED" : "REJECTED"),
        notes: options.notes,
        resolvedAt: new Date(),
      },
    });

    if (modCase.listingId) {
      const listingStatus =
        options.decision === "ALLOW"
          ? "ACTIVE"
          : options.decision === "BLOCK"
            ? "REJECTED"
            : "PENDING_REVIEW";

      await prisma.listing.update({
        where: { id: modCase.listingId },
        data: {
          moderationDecision: options.decision,
          status: listingStatus,
          ...(options.decision === "ALLOW" ? { publishedAt: new Date() } : {}),
        },
      });
    }

    return updated;
  }

  async listQueue(options?: { status?: ModerationStatus; riskLevel?: RiskLevel; take?: number }) {
    return prisma.moderationCase.findMany({
      where: {
        status: options?.status ?? "PENDING",
        ...(options?.riskLevel ? { riskLevel: options.riskLevel } : {}),
      },
      orderBy: [{ riskLevel: "desc" }, { createdAt: "asc" }],
      take: options?.take ?? 50,
      include: {
        listing: {
          select: { id: true, title: true, slug: true, priceInr: true, riskScore: true },
        },
      },
    });
  }

  async autoModerateListing(listingId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { trustScore: true, verificationLevel: true, createdAt: true } } },
    });
    if (!listing) throw new NotFoundError("Listing not found");

    const accountAgeDays = Math.floor(
      (Date.now() - listing.seller.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );

    const assessment = fraudRiskEngine.assess({
      askingPriceInr: listing.priceInr,
      trustScore: listing.seller.trustScore,
      verificationLevel: listing.seller.verificationLevel,
      accountAgeDays,
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        riskScore: assessment.score,
        riskLevel: assessment.level,
        moderationDecision:
          assessment.level === "CRITICAL"
            ? "BLOCK"
            : assessment.level === "HIGH"
              ? "REVIEW"
              : "ALLOW",
        status:
          assessment.level === "CRITICAL"
            ? "REJECTED"
            : assessment.level === "HIGH"
              ? "PENDING_REVIEW"
              : "ACTIVE",
        ...(assessment.level === "LOW" || assessment.level === "MEDIUM"
          ? { publishedAt: new Date() }
          : {}),
      },
    });

    if (assessment.level === "HIGH" || assessment.level === "CRITICAL") {
      await this.enqueueListing(listingId, assessment.summary);
    }

    return assessment;
  }
}

export const moderationService = new ModerationService();
