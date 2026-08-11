import type { FraudContext, FraudSignalInput } from "@/services/fraud/engine";

export type VerificationSignal = {
  identityVerified: boolean;
  faceVerified: boolean;
  livenessVerified: boolean;
  verificationAgeDays?: number;
  verificationFailures?: number;
  verificationRevoked?: boolean;
  verificationMethod?: string;
  isDevelopmentVerification?: boolean;
};

/**
 * Convert FairPrice ID verification state into fraud-engine context signals.
 * Verification reduces identity uncertainty — it does NOT prove listing legitimacy.
 */
export function toFraudVerificationContext(
  signal: VerificationSignal,
): Partial<FraudContext> & { verificationSignals?: FraudSignalInput[] } {
  const verificationSignals: FraudSignalInput[] = [];

  if (signal.verificationRevoked) {
    verificationSignals.push({
      signalType: "verification_revoked",
      weight: 20,
      evidence: { method: signal.verificationMethod },
    });
  }

  if ((signal.verificationFailures ?? 0) >= 3) {
    verificationSignals.push({
      signalType: "verification_failures",
      weight: Math.min(18, (signal.verificationFailures ?? 0) * 4),
      evidence: { count: signal.verificationFailures },
    });
  }

  if (signal.isDevelopmentVerification) {
    verificationSignals.push({
      signalType: "development_verification_only",
      weight: 8,
      evidence: { note: "Mock/dev verification must not be trusted as production identity" },
    });
  }

  // Unverified + will be combined with other signals by FraudRiskEngine
  let verificationLevel = "BASIC";
  if (signal.faceVerified && signal.livenessVerified) verificationLevel = "FACE_VERIFIED";
  else if (signal.identityVerified) verificationLevel = "IDENTITY_VERIFIED";

  return {
    verificationLevel,
    verificationSignals,
  };
}

export function applyVerificationFraudSignals(
  baseSignals: FraudSignalInput[],
  signal: VerificationSignal,
  askingPriceInr?: number,
  highValueThreshold = 50_000,
): FraudSignalInput[] {
  const extra = toFraudVerificationContext(signal).verificationSignals ?? [];
  const out = [...baseSignals, ...extra];

  const unverified =
    !signal.identityVerified && !(signal.faceVerified && signal.livenessVerified);

  if (unverified && (askingPriceInr ?? 0) >= highValueThreshold) {
    out.push({
      signalType: "high_value_unverified",
      weight: 14,
      evidence: { askingPriceInr, threshold: highValueThreshold },
    });
  }

  // Even verified users can be high risk — do not subtract fraud score to zero
  return out;
}
