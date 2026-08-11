export type AntiSpoofSignal = {
  code: string;
  weight: number;
  evidence?: Record<string, unknown>;
};

export type AntiSpoofAssessment = {
  riskScore: number;
  spoofSuspected: boolean;
  signals: AntiSpoofSignal[];
  /** Opaque classification for admins — not shown as a user "face score" */
  classification: "clear" | "watch" | "reject";
};

export type CaptureClientHints = {
  faceCount?: number;
  faceLostCount?: number;
  frameJitter?: number;
  screenMoiréHint?: boolean;
  cameraPermission?: "granted" | "denied" | "unavailable";
  captureDurationMs?: number;
  challengeResponses?: string[];
  automationHint?: boolean;
  lowLight?: boolean;
};

/**
 * Anti-spoofing risk signals. Exact rules are intentionally not exposed to users.
 * Production should prefer a specialized provider; this evaluates session/meta signals only.
 * Never accepts client "livenessPassed" claims as truth.
 */
export class AntiSpoofingService {
  assess(hints: CaptureClientHints, attemptCountRecent = 0): AntiSpoofAssessment {
    const signals: AntiSpoofSignal[] = [];

    if (hints.cameraPermission === "denied" || hints.cameraPermission === "unavailable") {
      signals.push({ code: "camera_unavailable", weight: 40 });
    }
    if ((hints.faceCount ?? 1) === 0) {
      signals.push({ code: "no_face", weight: 35 });
    }
    if ((hints.faceCount ?? 1) > 1) {
      signals.push({ code: "multiple_faces", weight: 30 });
    }
    if ((hints.faceLostCount ?? 0) >= 3) {
      signals.push({ code: "face_instability", weight: 22 });
    }
    if ((hints.frameJitter ?? 0) < 0.02 && (hints.captureDurationMs ?? 0) > 1500) {
      // Extremely static frames can indicate photo/screen replay
      signals.push({ code: "static_frame", weight: 28 });
    }
    if (hints.screenMoiréHint) {
      signals.push({ code: "display_artifact", weight: 32 });
    }
    if (hints.automationHint) {
      signals.push({ code: "automation", weight: 40 });
    }
    if (hints.lowLight) {
      signals.push({ code: "poor_quality", weight: 12 });
    }
    if (attemptCountRecent >= 3) {
      signals.push({ code: "rapid_retries", weight: 18 });
    }
    if ((hints.challengeResponses?.length ?? 0) === 0) {
      signals.push({ code: "missing_challenge", weight: 25 });
    }

    const riskScore = Math.min(
      100,
      signals.reduce((sum, s) => sum + s.weight, 0),
    );
    const spoofSuspected = riskScore >= 45;
    const classification =
      riskScore >= 60 ? "reject" : riskScore >= 35 ? "watch" : "clear";

    return { riskScore, spoofSuspected, signals, classification };
  }
}

export const antiSpoofingService = new AntiSpoofingService();
