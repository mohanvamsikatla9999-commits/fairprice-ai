import { prisma } from "@/lib/db";
import type { VerificationPolicy } from "@prisma/client";

const DEFAULTS = {
  key: "default",
  highValueListingInr: 50_000,
  enhancedValueListingInr: 100_000,
  requireIdentityAboveInr: 50_000,
  requireFaceAboveInr: null as number | null,
  maxAttemptsPerHour: 3,
  maxAttemptsPerDay: 8,
  cooldownMinutesAfterFail: 30,
  lockMinutesAfterRepeatedFail: 1440,
  failuresBeforeLock: 3,
  sessionTtlMinutes: 30,
  metadataRetentionDays: 365,
  tempCaptureRetentionMinutes: 15,
  buyerMinLevel: "EMAIL_VERIFIED",
  sellerMinLevel: "PHONE_VERIFIED",
  highVolumeSellerMinLevel: "IDENTITY_VERIFIED",
  businessMinLevel: "BUSINESS_VERIFIED",
};

export async function getVerificationPolicy(): Promise<VerificationPolicy> {
  const existing = await prisma.verificationPolicy.findUnique({
    where: { key: "default" },
  });
  if (existing) return existing;
  return prisma.verificationPolicy.create({ data: DEFAULTS });
}

export async function updateVerificationPolicy(
  patch: Partial<typeof DEFAULTS>,
): Promise<VerificationPolicy> {
  await getVerificationPolicy();
  return prisma.verificationPolicy.update({
    where: { key: "default" },
    data: patch,
  });
}

export function listingRequiresIdentity(
  priceInr: number,
  policy: VerificationPolicy,
): boolean {
  return priceInr >= policy.requireIdentityAboveInr;
}

export function listingRequiresFace(
  priceInr: number,
  policy: VerificationPolicy,
): boolean {
  if (policy.requireFaceAboveInr == null) return false;
  return priceInr >= policy.requireFaceAboveInr;
}
