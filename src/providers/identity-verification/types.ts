import type { IdvRiskClass, IdvStatus } from "@prisma/client";

export type LivenessChallenge =
  | "blink"
  | "look_left"
  | "look_right"
  | "turn_head_slightly"
  | "nod"
  | "hold_still";

export type CreateVerificationSessionInput = {
  userId: string;
  verificationId: string;
  consentId: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CreateVerificationSessionResult = {
  providerSessionId: string;
  challenges: LivenessChallenge[];
  expiresAt: Date;
  clientToken?: string;
  isDevelopment: boolean;
};

export type ProviderVerificationResult = {
  status: IdvStatus;
  faceDetected: boolean;
  faceQualityOk: boolean;
  livenessPassed: boolean;
  faceMatchPassed: boolean;
  documentChecked: boolean;
  identityVerified: boolean;
  riskClass: IdvRiskClass;
  failureReasonCode?: string;
  failureMessage?: string;
  providerReferenceId?: string;
  /** Never includes raw biometrics */
  signals?: Record<string, unknown>;
};

export type WebhookHandleResult = {
  accepted: boolean;
  providerEventId: string;
  verificationId?: string;
  result?: ProviderVerificationResult;
  duplicate?: boolean;
};

export type IdentityVerificationProvider = {
  readonly name: string;
  readonly isMock: boolean;
  createVerificationSession(
    input: CreateVerificationSessionInput,
  ): Promise<CreateVerificationSessionResult>;
  getVerificationStatus(providerSessionId: string): Promise<ProviderVerificationResult>;
  getVerificationResult(providerSessionId: string): Promise<ProviderVerificationResult>;
  cancelVerification(providerSessionId: string): Promise<void>;
  handleWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookHandleResult>;
  deleteTemporaryData(providerSessionId: string): Promise<void>;
};
