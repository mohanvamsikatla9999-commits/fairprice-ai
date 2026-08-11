import type { VerificationLevel } from "@prisma/client";

export type FairPriceIdLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type VerificationFlags = {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  faceVerified: boolean;
  livenessVerified: boolean;
  trustedSeller: boolean;
  businessVerified: boolean;
};

/**
 * Map capability flags → FairPrice ID level (0–6).
 * Face verification alone does not imply trustworthiness.
 */
export function computeFairPriceIdLevel(flags: VerificationFlags): FairPriceIdLevel {
  if (flags.businessVerified) return 6;
  if (flags.trustedSeller) return 5;
  if (flags.faceVerified && flags.livenessVerified) return 4;
  if (flags.identityVerified) return 3;
  if (flags.phoneVerified) return 2;
  if (flags.emailVerified) return 1;
  return 0;
}

export function levelToVerificationLevel(level: FairPriceIdLevel): VerificationLevel {
  switch (level) {
    case 0:
      return "BASIC";
    case 1:
      return "EMAIL_VERIFIED";
    case 2:
      return "PHONE_VERIFIED";
    case 3:
      return "IDENTITY_VERIFIED";
    case 4:
      return "FACE_VERIFIED";
    case 5:
      return "TRUSTED_SELLER";
    case 6:
      return "BUSINESS_VERIFIED";
  }
}

export function verificationLevelRank(level: VerificationLevel): number {
  const order: VerificationLevel[] = [
    "BASIC",
    "EMAIL_VERIFIED",
    "PHONE_VERIFIED",
    "IDENTITY_VERIFIED",
    "FACE_VERIFIED",
    "TRUSTED_SELLER",
    "BUSINESS_VERIFIED",
  ];
  return order.indexOf(level);
}

export function meetsMinLevel(
  current: VerificationLevel,
  required: VerificationLevel,
): boolean {
  return verificationLevelRank(current) >= verificationLevelRank(required);
}

export const LEVEL_LABELS: Record<FairPriceIdLevel, string> = {
  0: "Unverified",
  1: "Email verified",
  2: "Phone verified",
  3: "Identity verified",
  4: "Face + liveness verified",
  5: "Trusted seller",
  6: "Business verified",
};
