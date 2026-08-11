import { describe, expect, it } from "vitest";
import { fraudRiskEngine } from "@/services/fraud/engine";

describe("FraudRiskEngine", () => {
  it("returns LOW with no signals", () => {
    const result = fraudRiskEngine.assess({
      trustScore: 70,
      accountAgeDays: 200,
      verificationLevel: "EMAIL_VERIFIED",
    });
    expect(result.level).toBe("LOW");
    expect(result.score).toBe(0);
    expect(result.signals).toHaveLength(0);
  });

  it("returns MEDIUM for moderate signal stack", () => {
    const result = fraudRiskEngine.assess({
      accountAgeDays: 3,
      trustScore: 50,
      hasOffPlatformContact: true,
    });
    // new_account 15 + off_platform 20 = 35 => MEDIUM
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(60);
    expect(result.level).toBe("MEDIUM");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("returns HIGH for stacked risk signals", () => {
    const result = fraudRiskEngine.assess({
      askingPriceInr: 20_000,
      fairMidInr: 80_000,
      accountAgeDays: 2,
      trustScore: 20,
      hasExternalPaymentAsk: true,
      hasOffPlatformContact: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toMatch(/HIGH|CRITICAL/);
    expect(result.signals.some((s) => s.signalType === "price_too_good")).toBe(
      true,
    );
  });

  it("returns CRITICAL when score reaches 80+", () => {
    const result = fraudRiskEngine.assess({
      askingPriceInr: 15_000,
      fairMidInr: 100_000,
      accountAgeDays: 1,
      trustScore: 10,
      hasExternalPaymentAsk: true,
      hasOffPlatformContact: true,
      duplicateImageSuspect: true,
      reportCount: 3,
      newAccountUrgentSale: true,
      messageRiskFlags: ["otp_ask", "upi_pin"],
      verificationLevel: "BASIC",
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
    expect(result.summary).toContain("CRITICAL");
  });

  it("flags high-value unverified listings", () => {
    const result = fraudRiskEngine.assess({
      askingPriceInr: 150_000,
      verificationLevel: "BASIC",
      trustScore: 50,
      accountAgeDays: 100,
    });
    expect(
      result.signals.some((s) => s.signalType === "high_value_unverified"),
    ).toBe(true);
  });
});
