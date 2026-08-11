import { createHash, randomBytes } from "crypto";
import type { IdvStatus } from "@prisma/client";
import type {
  CreateVerificationSessionInput,
  CreateVerificationSessionResult,
  IdentityVerificationProvider,
  LivenessChallenge,
  ProviderVerificationResult,
  WebhookHandleResult,
} from "./types";

const CHALLENGE_POOL: LivenessChallenge[] = [
  "blink",
  "look_left",
  "look_right",
  "turn_head_slightly",
  "nod",
  "hold_still",
];

type MockSession = {
  verificationId: string;
  userId: string;
  challenges: LivenessChallenge[];
  expiresAt: Date;
  forceOutcome?: "success" | "fail" | "review" | "spoof";
  completed?: ProviderVerificationResult;
};

/**
 * Development-only identity verification provider.
 * Simulates consent → capture → liveness → result without storing biometrics.
 * NEVER treat mock results as real identity verification in production.
 */
export class MockIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly name = "mock";
  readonly isMock = true;

  private sessions = new Map<string, MockSession>();
  private seenEvents = new Set<string>();

  async createVerificationSession(
    input: CreateVerificationSessionInput,
  ): Promise<CreateVerificationSessionResult> {
    const providerSessionId = `mock_${randomBytes(16).toString("hex")}`;
    const challenges = this.pickChallenges(2);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const forceOutcome = this.readForceOutcome(input.metadata);

    this.sessions.set(providerSessionId, {
      verificationId: input.verificationId,
      userId: input.userId,
      challenges,
      expiresAt,
      forceOutcome,
    });

    return {
      providerSessionId,
      challenges,
      expiresAt,
      clientToken: createHash("sha256")
        .update(`${providerSessionId}:${input.userId}`)
        .digest("hex")
        .slice(0, 32),
      isDevelopment: true,
    };
  }

  async getVerificationStatus(providerSessionId: string): Promise<ProviderVerificationResult> {
    return this.getVerificationResult(providerSessionId);
  }

  async getVerificationResult(providerSessionId: string): Promise<ProviderVerificationResult> {
    const session = this.sessions.get(providerSessionId);
    if (!session) {
      return this.failed("SESSION_NOT_FOUND", "Verification session not found");
    }
    if (session.expiresAt.getTime() < Date.now()) {
      return this.failed("EXPIRED", "Verification session expired", "EXPIRED");
    }
    if (session.completed) return session.completed;

    // Default mock path: successful liveness when explicitly completed via simulate
    return {
      status: "IN_PROGRESS",
      faceDetected: false,
      faceQualityOk: false,
      livenessPassed: false,
      faceMatchPassed: false,
      documentChecked: false,
      identityVerified: false,
      riskClass: "LOW",
    };
  }

  /**
   * Completes a mock session with a simulated outcome.
   * Called only from server-side IdentityVerificationService — never from client claims.
   */
  completeSession(
    providerSessionId: string,
    options?: {
      outcome?: "success" | "fail" | "review" | "spoof";
      faceDetected?: boolean;
      faceQualityOk?: boolean;
      clientSignalKeys?: string[];
    },
  ): ProviderVerificationResult {
    const session = this.sessions.get(providerSessionId);
    if (!session) {
      return this.failed("SESSION_NOT_FOUND", "Verification session not found");
    }
    if (session.expiresAt.getTime() < Date.now()) {
      const expired = this.failed("EXPIRED", "Verification session expired", "EXPIRED");
      session.completed = expired;
      return expired;
    }

    const outcome = options?.outcome ?? session.forceOutcome ?? "success";
    let result: ProviderVerificationResult;

    if (outcome === "spoof") {
      result = {
        status: "FAILED",
        faceDetected: true,
        faceQualityOk: false,
        livenessPassed: false,
        faceMatchPassed: false,
        documentChecked: false,
        identityVerified: false,
        riskClass: "HIGH",
        failureReasonCode: "SPOOF_SUSPECTED",
        failureMessage: "Verification couldn't be completed.",
        providerReferenceId: `mock_ref_${providerSessionId.slice(-8)}`,
        signals: { spoof_indicator: true, development: true },
      };
    } else if (outcome === "fail") {
      result = {
        status: "FAILED",
        faceDetected: options?.faceDetected ?? true,
        faceQualityOk: options?.faceQualityOk ?? false,
        livenessPassed: false,
        faceMatchPassed: false,
        documentChecked: false,
        identityVerified: false,
        riskClass: "MEDIUM",
        failureReasonCode: "LIVENESS_FAILED",
        failureMessage: "Verification couldn't be completed.",
        providerReferenceId: `mock_ref_${providerSessionId.slice(-8)}`,
        signals: { development: true },
      };
    } else if (outcome === "review") {
      result = {
        status: "REVIEW_REQUIRED",
        faceDetected: true,
        faceQualityOk: true,
        livenessPassed: true,
        faceMatchPassed: false,
        documentChecked: false,
        identityVerified: false,
        riskClass: "MEDIUM",
        failureReasonCode: "MANUAL_REVIEW",
        failureMessage: "Verification requires manual review.",
        providerReferenceId: `mock_ref_${providerSessionId.slice(-8)}`,
        signals: { development: true, review: true },
      };
    } else {
      result = {
        status: "VERIFIED",
        faceDetected: true,
        faceQualityOk: true,
        livenessPassed: true,
        faceMatchPassed: true,
        documentChecked: false,
        identityVerified: true,
        riskClass: "LOW",
        providerReferenceId: `mock_ref_${providerSessionId.slice(-8)}`,
        signals: { development: true },
      };
    }

    session.completed = result;
    return result;
  }

  async cancelVerification(providerSessionId: string): Promise<void> {
    this.sessions.delete(providerSessionId);
  }

  async handleWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<WebhookHandleResult> {
    const signature = headers["x-fairprice-idv-signature"] ?? headers["x-idv-signature"];
    if (!signature) {
      return { accepted: false, providerEventId: "unsigned", duplicate: false };
    }

    let parsed: {
      eventId?: string;
      providerSessionId?: string;
      outcome?: "success" | "fail" | "review" | "spoof";
    };
    try {
      parsed = JSON.parse(rawBody) as typeof parsed;
    } catch {
      return { accepted: false, providerEventId: "invalid_json" };
    }

    const eventId = parsed.eventId ?? createHash("sha256").update(rawBody).digest("hex");
    if (this.seenEvents.has(eventId)) {
      return { accepted: true, providerEventId: eventId, duplicate: true };
    }

    // Mock signature: sha256(body + ".mock")
    const expected = createHash("sha256").update(`${rawBody}.mock`).digest("hex");
    if (signature !== expected) {
      return { accepted: false, providerEventId: eventId };
    }

    this.seenEvents.add(eventId);
    const session = parsed.providerSessionId
      ? this.sessions.get(parsed.providerSessionId)
      : undefined;
    const result = parsed.providerSessionId
      ? this.completeSession(parsed.providerSessionId, { outcome: parsed.outcome ?? "success" })
      : undefined;

    return {
      accepted: true,
      providerEventId: eventId,
      verificationId: session?.verificationId,
      result,
      duplicate: false,
    };
  }

  async deleteTemporaryData(providerSessionId: string): Promise<void> {
    // Mock never stores biometric material; clear session state only
    const session = this.sessions.get(providerSessionId);
    if (session) {
      this.sessions.set(providerSessionId, {
        ...session,
        completed: session.completed,
      });
    }
  }

  getSessionChallenges(providerSessionId: string): LivenessChallenge[] {
    return this.sessions.get(providerSessionId)?.challenges ?? [];
  }

  private pickChallenges(count: number): LivenessChallenge[] {
    const pool = [...CHALLENGE_POOL];
    const picked: LivenessChallenge[] = [];
    while (picked.length < count && pool.length > 0) {
      const idx = randomBytes(1)[0]! % pool.length;
      picked.push(pool.splice(idx, 1)[0]!);
    }
    return picked;
  }

  private readForceOutcome(
    metadata?: Record<string, unknown>,
  ): "success" | "fail" | "review" | "spoof" | undefined {
    const v = metadata?.forceOutcome;
    if (v === "success" || v === "fail" || v === "review" || v === "spoof") return v;
    return undefined;
  }

  private failed(
    code: string,
    message: string,
    status: IdvStatus = "FAILED",
  ): ProviderVerificationResult {
    return {
      status,
      faceDetected: false,
      faceQualityOk: false,
      livenessPassed: false,
      faceMatchPassed: false,
      documentChecked: false,
      identityVerified: false,
      riskClass: "MEDIUM",
      failureReasonCode: code,
      failureMessage: message,
    };
  }
}
