import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type DuplicateSignal = {
  signalType: string;
  strength: number;
  relatedUserId: string;
  evidence?: Record<string, unknown>;
};

export type DuplicateAssessment = {
  riskScore: number;
  signals: DuplicateSignal[];
  requiresManualReview: boolean;
};

/**
 * Duplicate account risk — score + review, never auto-ban on IP/device alone.
 */
export class DuplicateAccountDetectionService {
  async assess(userId: string): Promise<DuplicateAssessment> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        devices: { select: { fingerprint: true } },
      },
    });
    if (!user) {
      return { riskScore: 0, signals: [], requiresManualReview: false };
    }

    const signals: DuplicateSignal[] = [];

    if (user.phone && user.phoneVerified) {
      const phonePeers = await prisma.user.findMany({
        where: {
          id: { not: userId },
          phone: user.phone,
          deletedAt: null,
        },
        select: { id: true },
        take: 5,
      });
      for (const peer of phonePeers) {
        signals.push({
          signalType: "verified_phone_overlap",
          strength: 40,
          relatedUserId: peer.id,
        });
      }
    }

    const fingerprints = user.devices.map((d) => d.fingerprint).filter(Boolean);
    if (fingerprints.length > 0) {
      const devicePeers = await prisma.device.findMany({
        where: {
          fingerprint: { in: fingerprints },
          userId: { not: userId },
        },
        select: { userId: true, fingerprint: true },
        take: 10,
      });
      const seen = new Set<string>();
      for (const peer of devicePeers) {
        if (seen.has(peer.userId)) continue;
        seen.add(peer.userId);
        signals.push({
          signalType: "device_overlap",
          strength: 12,
          relatedUserId: peer.userId,
          evidence: { note: "Shared device token — may be family/office" },
        });
      }
    }

    // Persist soft link signals for review (non-destructive)
    for (const signal of signals) {
      const [a, b] =
        userId < signal.relatedUserId
          ? [userId, signal.relatedUserId]
          : [signal.relatedUserId, userId];
      await prisma.accountLinkSignal.upsert({
        where: {
          userAId_userBId_signalType: {
            userAId: a,
            userBId: b,
            signalType: signal.signalType,
          },
        },
        create: {
          userAId: a,
          userBId: b,
          signalType: signal.signalType,
          strength: signal.strength,
          evidence: (signal.evidence as Prisma.InputJsonValue | undefined) ?? undefined,
        },
        update: { strength: signal.strength },
      });
    }

    const riskScore = Math.min(
      100,
      signals.reduce((sum, s) => sum + s.strength, 0),
    );

    return {
      riskScore,
      signals,
      // Strong identity overlaps warrant review; device-only does not auto-ban
      requiresManualReview:
        signals.some((s) => s.signalType === "verified_phone_overlap") ||
        riskScore >= 50,
    };
  }
}

export const duplicateAccountDetectionService = new DuplicateAccountDetectionService();
