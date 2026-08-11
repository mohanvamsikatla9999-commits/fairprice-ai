import { describe, expect, it } from "vitest";
import {
  canTransition,
  assertTransition,
} from "@/services/verification/state-machine";
import {
  computeFairPriceIdLevel,
  levelToVerificationLevel,
  meetsMinLevel,
} from "@/services/verification/levels";
import { antiSpoofingService } from "@/services/verification/anti-spoofing";
import { livenessVerificationService } from "@/services/verification/liveness";
import { trustScoreEngine } from "@/services/verification/trust-score";
import { scrubBiometrics } from "@/services/verification/audit";
import { verificationAttemptLimitService } from "@/services/verification/attempt-limits";
import { AppError } from "@/lib/api/errors";
import { fraudRiskEngine } from "@/services/fraud/engine";
import { hasPermission } from "@/lib/auth/rbac";
import { createHash } from "crypto";
import { MockIdentityVerificationProvider } from "@/providers/identity-verification/mock-provider";

describe("verification state machine", () => {
  it("allows consent → face → liveness → verified", () => {
    expect(canTransition("CONSENT_REQUIRED", "FACE_PENDING")).toBe(true);
    expect(canTransition("FACE_PENDING", "LIVENESS_PENDING")).toBe(true);
    expect(canTransition("LIVENESS_PENDING", "VERIFIED")).toBe(true);
  });

  it("rejects verified → in_progress", () => {
    expect(canTransition("VERIFIED", "IN_PROGRESS")).toBe(false);
    expect(() => assertTransition("VERIFIED", "IN_PROGRESS")).toThrow(AppError);
  });

  it("allows revoke from verified", () => {
    expect(canTransition("VERIFIED", "REVOKED")).toBe(true);
  });
});

describe("FairPrice ID levels", () => {
  it("maps flags to levels 0–6", () => {
    expect(
      computeFairPriceIdLevel({
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
        faceVerified: false,
        livenessVerified: false,
        trustedSeller: false,
        businessVerified: false,
      }),
    ).toBe(0);
    expect(
      computeFairPriceIdLevel({
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        faceVerified: true,
        livenessVerified: true,
        trustedSeller: false,
        businessVerified: false,
      }),
    ).toBe(4);
    expect(levelToVerificationLevel(4)).toBe("FACE_VERIFIED");
  });

  it("meetsMinLevel compares ranks", () => {
    expect(meetsMinLevel("FACE_VERIFIED", "IDENTITY_VERIFIED")).toBe(true);
    expect(meetsMinLevel("EMAIL_VERIFIED", "PHONE_VERIFIED")).toBe(false);
  });
});

describe("liveness + anti-spoof", () => {
  it("fails incomplete challenges", () => {
    const result = livenessVerificationService.evaluate({
      challenges: ["blink", "look_left"],
      completedChallenges: ["blink"],
      hints: { faceCount: 1, cameraPermission: "granted", frameJitter: 0.1 },
    });
    expect(result.passed).toBe(false);
    expect(result.reasonCode).toBe("CHALLENGE_INCOMPLETE");
  });

  it("rejects spoof-like static capture", () => {
    const spoof = antiSpoofingService.assess({
      faceCount: 1,
      frameJitter: 0.01,
      captureDurationMs: 3000,
      screenMoiréHint: true,
      cameraPermission: "granted",
      challengeResponses: ["blink"],
    });
    expect(spoof.spoofSuspected).toBe(true);
  });

  it("passes complete challenges with healthy hints", () => {
    const result = livenessVerificationService.evaluate({
      challenges: ["blink", "look_right"],
      completedChallenges: ["blink", "look_right"],
      hints: {
        faceCount: 1,
        cameraPermission: "granted",
        frameJitter: 0.15,
        captureDurationMs: 4000,
      },
    });
    expect(result.passed).toBe(true);
  });
});

describe("trust score engine", () => {
  it("caps verification contribution so face alone cannot dominate", () => {
    const onlyFace = trustScoreEngine.compute({
      flags: {
        emailVerified: false,
        phoneVerified: false,
        identityVerified: false,
        faceVerified: true,
        livenessVerified: true,
        trustedSeller: false,
        businessVerified: false,
      },
      accountAgeDays: 1,
      completedTransactions: 0,
    });
    expect(onlyFace.components.verification).toBeLessThanOrEqual(22);
    expect(onlyFace.score).toBeLessThan(60);
  });
});

describe("privacy scrubbing", () => {
  it("redacts biometric-like keys", () => {
    const scrubbed = scrubBiometrics({
      faceImage: "base64data",
      status: "ok",
      selfie: "xxx",
    });
    expect(scrubbed?.faceImage).toBe("[redacted]");
    expect(scrubbed?.selfie).toBe("[redacted]");
    expect(scrubbed?.status).toBe("ok");
  });
});

describe("client status manipulation", () => {
  it("rejects client-set verified flags", async () => {
    await expect(
      verificationAttemptLimitService.assertNotManipulatingClientStatus({
        faceVerified: true,
      }),
    ).rejects.toThrow(/Client cannot set verification status/);
  });
});

describe("fraud + verification signals", () => {
  it("still risks unverified high-value even without BASIC-only rule", () => {
    const result = fraudRiskEngine.assess({
      askingPriceInr: 80_000,
      highValueThresholdInr: 50_000,
      identityVerified: false,
      trustScore: 50,
      accountAgeDays: 100,
    });
    expect(result.signals.some((s) => s.signalType === "high_value_unverified")).toBe(
      true,
    );
  });

  it("face verify does not wipe stacked fraud signals", () => {
    const result = fraudRiskEngine.assess({
      askingPriceInr: 20_000,
      fairMidInr: 80_000,
      accountAgeDays: 2,
      trustScore: 20,
      hasExternalPaymentAsk: true,
      massMessaging: true,
      listingVelocityBurst: true,
      faceVerified: true,
      livenessVerified: true,
      identityVerified: true,
    });
    expect(result.level).toMatch(/HIGH|CRITICAL/);
  });
});

describe("RBAC verification:review", () => {
  it("grants moderators review permission", () => {
    expect(hasPermission("MODERATOR", "verification:review")).toBe(true);
    expect(hasPermission("USER", "verification:review")).toBe(false);
  });
});

describe("mock identity provider webhooks", () => {
  it("rejects unsigned webhooks", async () => {
    const provider = new MockIdentityVerificationProvider();
    const result = await provider.handleWebhook(JSON.stringify({ eventId: "e1" }), {});
    expect(result.accepted).toBe(false);
  });

  it("accepts signed webhooks and is idempotent", async () => {
    const provider = new MockIdentityVerificationProvider();
    const session = await provider.createVerificationSession({
      userId: "u1",
      verificationId: "v1",
      consentId: "c1",
    });
    const body = JSON.stringify({
      eventId: "evt_1",
      providerSessionId: session.providerSessionId,
      outcome: "success",
    });
    const signature = createHash("sha256").update(`${body}.mock`).digest("hex");
    const first = await provider.handleWebhook(body, {
      "x-fairprice-idv-signature": signature,
    });
    const second = await provider.handleWebhook(body, {
      "x-fairprice-idv-signature": signature,
    });
    expect(first.accepted).toBe(true);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(first.result?.status).toBe("VERIFIED");
  });
});
