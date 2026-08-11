import type { RiskLevel } from "@prisma/client";
import { clamp } from "@/lib/utils";

export type FraudSignalInput = {
  signalType: string;
  weight: number;
  evidence?: Record<string, unknown>;
};

export type FraudContext = {
  askingPriceInr?: number;
  fairMidInr?: number;
  accountAgeDays?: number;
  trustScore?: number;
  verificationLevel?: string;
  listingAgeHours?: number;
  hasExternalPaymentAsk?: boolean;
  hasOffPlatformContact?: boolean;
  duplicateImageSuspect?: boolean;
  reportCount?: number;
  messageRiskFlags?: string[];
  cityMismatch?: boolean;
  newAccountUrgentSale?: boolean;
  identityVerified?: boolean;
  faceVerified?: boolean;
  livenessVerified?: boolean;
  verificationRevoked?: boolean;
  verificationFailures?: number;
  listingVelocityBurst?: boolean;
  massMessaging?: boolean;
  highValueThresholdInr?: number;
};

export type FraudAssessment = {
  score: number;
  level: RiskLevel;
  summary: string;
  signals: FraudSignalInput[];
  recommendations: string[];
};

function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export class FraudRiskEngine {
  assess(context: FraudContext): FraudAssessment {
    const signals: FraudSignalInput[] = [];

    if (
      context.askingPriceInr &&
      context.fairMidInr &&
      context.fairMidInr > 0 &&
      context.askingPriceInr < context.fairMidInr * 0.55
    ) {
      signals.push({
        signalType: "price_too_good",
        weight: 25,
        evidence: {
          askingPriceInr: context.askingPriceInr,
          fairMidInr: context.fairMidInr,
        },
      });
    }

    if ((context.accountAgeDays ?? 365) < 7) {
      signals.push({
        signalType: "new_account",
        weight: 15,
        evidence: { accountAgeDays: context.accountAgeDays },
      });
    }

    if ((context.trustScore ?? 50) < 35) {
      signals.push({
        signalType: "low_trust_score",
        weight: 18,
        evidence: { trustScore: context.trustScore },
      });
    }

    if (context.hasExternalPaymentAsk) {
      signals.push({
        signalType: "external_payment_ask",
        weight: 30,
        evidence: { note: "Requested UPI/crypto/gift card outside platform norms" },
      });
    }

    if (context.hasOffPlatformContact) {
      signals.push({
        signalType: "off_platform_contact",
        weight: 20,
        evidence: { note: "Pushed WhatsApp/Telegram/email early" },
      });
    }

    if (context.duplicateImageSuspect) {
      signals.push({
        signalType: "duplicate_images",
        weight: 22,
        evidence: { note: "Image hash matched other listings" },
      });
    }

    if ((context.reportCount ?? 0) > 0) {
      signals.push({
        signalType: "prior_reports",
        weight: Math.min(25, (context.reportCount ?? 0) * 8),
        evidence: { reportCount: context.reportCount },
      });
    }

    if (context.cityMismatch) {
      signals.push({
        signalType: "location_mismatch",
        weight: 10,
        evidence: { note: "Seller city inconsistent with meetup claims" },
      });
    }

    if (context.newAccountUrgentSale) {
      signals.push({
        signalType: "urgency_pressure",
        weight: 16,
        evidence: { note: "New account + urgent sale language" },
      });
    }

    for (const flag of context.messageRiskFlags ?? []) {
      signals.push({
        signalType: `message_${flag}`,
        weight: 12,
        evidence: { flag },
      });
    }

    if (
      context.verificationLevel === "BASIC" &&
      (context.askingPriceInr ?? 0) > 100_000
    ) {
      signals.push({
        signalType: "high_value_unverified",
        weight: 14,
        evidence: { verificationLevel: context.verificationLevel },
      });
    }

    const highValueThreshold = context.highValueThresholdInr ?? 50_000;
    const identityOk =
      context.identityVerified ||
      context.verificationLevel === "IDENTITY_VERIFIED" ||
      context.verificationLevel === "FACE_VERIFIED" ||
      context.verificationLevel === "TRUSTED_SELLER" ||
      context.verificationLevel === "BUSINESS_VERIFIED";

    if (!identityOk && (context.askingPriceInr ?? 0) >= highValueThreshold) {
      if (!signals.some((s) => s.signalType === "high_value_unverified")) {
        signals.push({
          signalType: "high_value_unverified",
          weight: 14,
          evidence: {
            askingPriceInr: context.askingPriceInr,
            threshold: highValueThreshold,
          },
        });
      }
    }

    if (context.verificationRevoked) {
      signals.push({
        signalType: "verification_revoked",
        weight: 20,
      });
    }

    if ((context.verificationFailures ?? 0) >= 3) {
      signals.push({
        signalType: "verification_failures",
        weight: Math.min(18, (context.verificationFailures ?? 0) * 4),
        evidence: { count: context.verificationFailures },
      });
    }

    if (context.listingVelocityBurst) {
      signals.push({
        signalType: "listing_velocity",
        weight: 22,
        evidence: { note: "Burst of listings in short window" },
      });
    }

    if (context.massMessaging) {
      signals.push({
        signalType: "mass_messaging",
        weight: 18,
      });
    }

    // Face/liveness reduces identity uncertainty but does NOT clear other fraud signals
    if (
      context.faceVerified &&
      context.livenessVerified &&
      !context.identityVerified &&
      (context.askingPriceInr ?? 0) >= highValueThreshold
    ) {
      // Slight mitigation only — keep other signals intact
      signals.push({
        signalType: "face_verified_partial_identity",
        weight: -4,
        evidence: { note: "Face+liveness reduces identity uncertainty only" },
      });
    }

    const score = clamp(
      signals.reduce((sum, s) => sum + s.weight, 0),
      0,
      100,
    );
    const level = levelFromScore(score);

    const recommendations: string[] = [];
    if (level !== "LOW") {
      recommendations.push("Meet in a public place and inspect the item in person");
      recommendations.push("Do not share OTPs or pay advances to unknown parties");
    }
    if (signals.some((s) => s.signalType === "external_payment_ask")) {
      recommendations.push("Refuse off-platform payment requests");
    }
    if (signals.some((s) => s.signalType === "price_too_good")) {
      recommendations.push("Treat deep discounts as a red flag until verified");
    }
    if (level === "HIGH" || level === "CRITICAL") {
      recommendations.push("Report this listing/user to FairPrice AI moderation");
    }

    return {
      score,
      level,
      summary: this.summarize(score, level, signals),
      signals,
      recommendations,
    };
  }

  private summarize(score: number, level: RiskLevel, signals: FraudSignalInput[]): string {
    if (signals.length === 0) {
      return "No significant fraud signals detected.";
    }
    const top = [...signals]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((s) => s.signalType.replace(/_/g, " "))
      .join(", ");
    return `Risk ${level} (score ${score}/100). Key signals: ${top}.`;
  }
}

export const fraudRiskEngine = new FraudRiskEngine();
