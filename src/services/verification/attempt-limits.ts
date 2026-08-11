import { prisma } from "@/lib/db";
import { RateLimitError, AppError } from "@/lib/api/errors";
import { getVerificationPolicy } from "./policy";

export type AttemptLimitResult = {
  allowed: boolean;
  reason?: string;
  retryAfterMinutes?: number;
  attemptsLastHour: number;
  attemptsLastDay: number;
};

export class VerificationAttemptLimitService {
  async check(userId: string): Promise<AttemptLimitResult> {
    const policy = await getVerificationPolicy();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLockedUntil: true,
        verificationFailureCount: true,
      },
    });

    if (user?.verificationLockedUntil && user.verificationLockedUntil > new Date()) {
      const retryAfterMinutes = Math.ceil(
        (user.verificationLockedUntil.getTime() - Date.now()) / 60_000,
      );
      return {
        allowed: false,
        reason: "Verification temporarily locked. Please try again later.",
        retryAfterMinutes,
        attemptsLastHour: 0,
        attemptsLastDay: 0,
      };
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [attemptsLastHour, attemptsLastDay] = await Promise.all([
      prisma.verificationAttempt.count({
        where: { userId, createdAt: { gte: hourAgo } },
      }),
      prisma.verificationAttempt.count({
        where: { userId, createdAt: { gte: dayAgo } },
      }),
    ]);

    if (attemptsLastHour >= policy.maxAttemptsPerHour) {
      return {
        allowed: false,
        reason: "Too many verification attempts. Please wait before retrying.",
        retryAfterMinutes: policy.cooldownMinutesAfterFail,
        attemptsLastHour,
        attemptsLastDay,
      };
    }

    if (attemptsLastDay >= policy.maxAttemptsPerDay) {
      return {
        allowed: false,
        reason: "Daily verification attempt limit reached.",
        retryAfterMinutes: 60,
        attemptsLastHour,
        attemptsLastDay,
      };
    }

    return { allowed: true, attemptsLastHour, attemptsLastDay };
  }

  async assertAllowed(userId: string): Promise<void> {
    const result = await this.check(userId);
    if (!result.allowed) {
      throw new RateLimitError(result.reason ?? "Verification rate limited", {
        retryAfterMinutes: result.retryAfterMinutes,
      });
    }
  }

  async recordFailure(userId: string): Promise<void> {
    const policy = await getVerificationPolicy();
    const user = await prisma.user.update({
      where: { id: userId },
      data: { verificationFailureCount: { increment: 1 } },
      select: { verificationFailureCount: true },
    });

    if (user.verificationFailureCount >= policy.failuresBeforeLock) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationLockedUntil: new Date(
            Date.now() + policy.lockMinutesAfterRepeatedFail * 60_000,
          ),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationLockedUntil: new Date(
            Date.now() + policy.cooldownMinutesAfterFail * 60_000,
          ),
        },
      });
    }
  }

  async resetFailures(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationFailureCount: 0,
        verificationLockedUntil: null,
      },
    });
  }

  async assertNotManipulatingClientStatus(body: Record<string, unknown>): Promise<void> {
    const forbidden = [
      "faceVerified",
      "identityVerified",
      "livenessVerified",
      "faceVerifiedAt",
      "identityVerifiedAt",
      "livenessVerifiedAt",
      "verificationLevel",
      "status",
    ];
    for (const key of forbidden) {
      if (
        key in body &&
        (body[key] === true ||
          body[key] === "VERIFIED" ||
          body[key] === "FACE_VERIFIED" ||
          body[key] === "IDENTITY_VERIFIED")
      ) {
        throw new AppError(
          "Client cannot set verification status",
          400,
          "CLIENT_STATUS_MANIPULATION",
        );
      }
    }
  }
}

export const verificationAttemptLimitService = new VerificationAttemptLimitService();
