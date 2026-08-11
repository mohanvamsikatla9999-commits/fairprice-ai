import type { LivenessChallenge } from "@/providers/identity-verification";
import { antiSpoofingService, type CaptureClientHints } from "./anti-spoofing";

export type LivenessResult = {
  passed: boolean;
  challengesPresented: LivenessChallenge[];
  challengesCompleted: string[];
  antiSpoof: ReturnType<AntiSpoofingService["assess"]>;
  reasonCode?: string;
};

type AntiSpoofingService = typeof antiSpoofingService;

/**
 * LivenessVerificationService — challenge orchestration + anti-spoof gate.
 * Final pass/fail still comes from the IdentityVerificationProvider in production.
 * This service never sends images to LLMs.
 */
export class LivenessVerificationService {
  evaluate(options: {
    challenges: LivenessChallenge[];
    completedChallenges: string[];
    hints: CaptureClientHints;
    recentAttemptCount?: number;
  }): LivenessResult {
    const { challenges, completedChallenges, hints, recentAttemptCount = 0 } = options;
    const antiSpoof = antiSpoofingService.assess(
      {
        ...hints,
        challengeResponses: completedChallenges,
      },
      recentAttemptCount,
    );

    const required = new Set(challenges);
    const completed = completedChallenges.filter((c) =>
      required.has(c as LivenessChallenge),
    );
    const allChallengesMet = challenges.every((c) => completed.includes(c));

    if (antiSpoof.classification === "reject" || antiSpoof.spoofSuspected) {
      return {
        passed: false,
        challengesPresented: challenges,
        challengesCompleted: completed,
        antiSpoof,
        reasonCode: "SPOOF_OR_QUALITY",
      };
    }

    if (!allChallengesMet) {
      return {
        passed: false,
        challengesPresented: challenges,
        challengesCompleted: completed,
        antiSpoof,
        reasonCode: "CHALLENGE_INCOMPLETE",
      };
    }

    return {
      passed: true,
      challengesPresented: challenges,
      challengesCompleted: completed,
      antiSpoof,
    };
  }
}

export const livenessVerificationService = new LivenessVerificationService();
