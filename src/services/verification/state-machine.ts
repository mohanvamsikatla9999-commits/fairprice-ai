import type { IdvStatus } from "@prisma/client";
import { AppError } from "@/lib/api/errors";

/**
 * FairPrice ID verification state machine.
 * All transitions are server-authoritative — clients cannot set VERIFIED.
 */
const ALLOWED: Record<IdvStatus, IdvStatus[]> = {
  NOT_STARTED: ["CONSENT_REQUIRED", "IN_PROGRESS"],
  CONSENT_REQUIRED: ["IN_PROGRESS", "FACE_PENDING", "DOCUMENT_PENDING", "FAILED", "EXPIRED"],
  IN_PROGRESS: [
    "DOCUMENT_PENDING",
    "FACE_PENDING",
    "LIVENESS_PENDING",
    "REVIEW_REQUIRED",
    "VERIFIED",
    "FAILED",
    "EXPIRED",
    "SUSPENDED",
  ],
  DOCUMENT_PENDING: [
    "FACE_PENDING",
    "LIVENESS_PENDING",
    "REVIEW_REQUIRED",
    "FAILED",
    "EXPIRED",
    "IN_PROGRESS",
  ],
  FACE_PENDING: [
    "LIVENESS_PENDING",
    "REVIEW_REQUIRED",
    "FAILED",
    "EXPIRED",
    "IN_PROGRESS",
    "VERIFIED",
  ],
  LIVENESS_PENDING: [
    "REVIEW_REQUIRED",
    "VERIFIED",
    "FAILED",
    "EXPIRED",
    "IN_PROGRESS",
  ],
  REVIEW_REQUIRED: ["VERIFIED", "FAILED", "REVOKED", "SUSPENDED"],
  VERIFIED: ["REVOKED", "SUSPENDED", "EXPIRED"],
  FAILED: ["CONSENT_REQUIRED", "IN_PROGRESS", "REVIEW_REQUIRED", "EXPIRED", "FACE_PENDING"],
  EXPIRED: ["CONSENT_REQUIRED", "IN_PROGRESS", "FACE_PENDING"],
  REVOKED: ["CONSENT_REQUIRED", "IN_PROGRESS", "FACE_PENDING"],
  SUSPENDED: ["REVOKED", "CONSENT_REQUIRED", "IN_PROGRESS", "FAILED"],
};

export function canTransition(from: IdvStatus, to: IdvStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: IdvStatus, to: IdvStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      `Invalid verification transition: ${from} → ${to}`,
      409,
      "INVALID_VERIFICATION_TRANSITION",
      { from, to },
    );
  }
}

export function isTerminalStatus(status: IdvStatus): boolean {
  return status === "VERIFIED" || status === "REVOKED" || status === "SUSPENDED";
}

export function isActiveSessionStatus(status: IdvStatus): boolean {
  return (
    status === "CONSENT_REQUIRED" ||
    status === "IN_PROGRESS" ||
    status === "DOCUMENT_PENDING" ||
    status === "FACE_PENDING" ||
    status === "LIVENESS_PENDING"
  );
}
