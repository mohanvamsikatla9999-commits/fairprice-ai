import { clamp } from "@/lib/utils";
import type { VerificationFlags } from "./levels";

export type TrustScoreInput = {
  flags: VerificationFlags;
  accountAgeDays: number;
  completedTransactions: number;
  ratingAvg?: number;
  reviewCount?: number;
  responseRate?: number;
  reportCount?: number;
  fraudHistoryScore?: number;
  verificationRevoked?: boolean;
  verificationFailures?: number;
};

/**
 * Marketplace trust score — verification is one layer, not the entire score.
 * Cap verification contribution so face verify alone cannot create extreme trust.
 */
export class TrustScoreEngine {
  compute(input: TrustScoreInput): {
    score: number;
    components: Record<string, number>;
  } {
    const components: Record<string, number> = {};

    // Base
    components.base = 40;

    // Verification contribution (max ~22)
    let verification = 0;
    if (input.flags.emailVerified) verification += 3;
    if (input.flags.phoneVerified) verification += 4;
    if (input.flags.identityVerified) verification += 6;
    if (input.flags.faceVerified && input.flags.livenessVerified) verification += 5;
    if (input.flags.trustedSeller) verification += 2;
    if (input.flags.businessVerified) verification += 2;
    components.verification = Math.min(22, verification);

    // Account age (max 12)
    components.accountAge = clamp(Math.floor(input.accountAgeDays / 30) * 2, 0, 12);

    // Transactions (max 16)
    components.transactions = clamp(input.completedTransactions * 2, 0, 16);

    // Ratings (max 12)
    if ((input.reviewCount ?? 0) > 0 && input.ratingAvg) {
      components.ratings = clamp(Math.round((input.ratingAvg - 3) * 6), 0, 12);
    } else {
      components.ratings = 0;
    }

    // Response rate (max 8)
    components.response = clamp(Math.round((input.responseRate ?? 0) * 8), 0, 8);

    // Penalties
    components.reports = -clamp((input.reportCount ?? 0) * 6, 0, 24);
    components.fraud = -clamp(Math.round((input.fraudHistoryScore ?? 0) * 0.4), 0, 30);
    if (input.verificationRevoked) components.revoked = -15;
    components.failures = -clamp((input.verificationFailures ?? 0) * 2, 0, 10);

    const score = clamp(
      Object.values(components).reduce((a, b) => a + b, 0),
      0,
      100,
    );

    return { score, components };
  }
}

export const trustScoreEngine = new TrustScoreEngine();
