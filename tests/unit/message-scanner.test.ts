import { describe, expect, it } from "vitest";
import { scanMessage } from "@/services/fraud/message-scanner";

describe("scanMessage", () => {
  it("flags OTP requests with a warning", () => {
    const result = scanMessage("Please share the OTP once you get it");
    expect(result.flags).toContain("otp_ask");
    expect(result.warning).toMatch(/OTP/i);
    expect(result.riskScore).toBeGreaterThanOrEqual(40);
  });

  it("flags QR code scan requests", () => {
    const result = scanMessage("Scan this QR and pay the booking amount");
    expect(result.flags).toContain("qr_code");
    expect(result.warning).toMatch(/QR/i);
    expect(result.riskScore).toBeGreaterThanOrEqual(36);
  });

  it("flags UPI PIN sharing requests", () => {
    const result = scanMessage("Enter your UPI PIN to confirm the transfer");
    expect(result.flags).toContain("upi_pin");
    expect(result.warning).toMatch(/UPI PIN/i);
    expect(result.riskScore).toBeGreaterThanOrEqual(42);
  });

  it("flags WhatsApp off-platform patterns", () => {
    const result = scanMessage("Message me on WhatsApp for the deal", {
      isFirstMessage: true,
    });
    expect(result.flags).toContain("off_platform");
    expect(result.warning).toMatch(/off-platform|cautious/i);
    expect(
      result.matchedPatterns.find((p) => p.id === "off_platform")?.weight,
    ).toBeGreaterThan(18);
  });

  it("returns null warning for benign messages", () => {
    const result = scanMessage("Can we meet tomorrow near the metro?");
    expect(result.flags).toHaveLength(0);
    expect(result.warning).toBeNull();
    expect(result.riskScore).toBe(0);
  });

  it("stacks multiple patterns into a higher score", () => {
    const result = scanMessage(
      "Share the OTP and WhatsApp me after you scan this QR",
    );
    expect(result.flags).toEqual(
      expect.arrayContaining(["otp_ask", "off_platform", "qr_code"]),
    );
    expect(result.riskScore).toBeGreaterThan(70);
  });
});
