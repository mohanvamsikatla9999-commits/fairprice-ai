import { describe, expect, it } from "vitest";
import { canTransition } from "@/services/verification/state-machine";

describe("auth face session gating helpers", () => {
  it("keeps face pending transitions valid for auth challenge flow", () => {
    expect(canTransition("CONSENT_REQUIRED", "FACE_PENDING")).toBe(true);
    expect(canTransition("FACE_PENDING", "LIVENESS_PENDING")).toBe(true);
    expect(canTransition("LIVENESS_PENDING", "VERIFIED")).toBe(true);
  });
});
