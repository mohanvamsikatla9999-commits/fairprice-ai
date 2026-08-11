import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeVerificationAudit(options: {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const safeMeta = scrubBiometrics(options.metadata);
  const metadata = safeMeta as Prisma.InputJsonValue | undefined;
  await prisma.verificationAuditLog.create({
    data: {
      userId: options.userId ?? undefined,
      actorId: options.actorId ?? undefined,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      ipAddress: options.ipAddress,
      metadata,
    },
  });

  // Also mirror into general audit log for platform consistency
  await prisma.auditLog.create({
    data: {
      userId: options.actorId ?? options.userId ?? undefined,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      ipAddress: options.ipAddress,
      metadata,
    },
  });
}

const BIOMETRIC_KEYS = [
  "image",
  "images",
  "faceImage",
  "selfie",
  "biometric",
  "template",
  "embedding",
  "frame",
  "frames",
  "base64",
  "photo",
];

export function scrubBiometrics(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (BIOMETRIC_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && value.length > 500 && /^[A-Za-z0-9+/=]+$/.test(value)) {
      out[key] = "[redacted-blob]";
      continue;
    }
    out[key] = value;
  }
  return out;
}
