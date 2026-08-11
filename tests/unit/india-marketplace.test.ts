import { describe, expect, it } from "vitest";
import { distanceKm, findCityBySlug } from "@/config/india-cities";
import { normalizeIndiaPhone } from "@/lib/auth/phone-otp";
import { env } from "@/config/env";
import { meetupSuggestions, maskPhone } from "@/services/chat/deal-helpers";

describe("india cities", () => {
  it("resolves hyderabad", () => {
    expect(findCityBySlug("hyderabad")?.name).toBe("Hyderabad");
  });

  it("computes distance roughly between hyderabad and bengaluru", () => {
    const hyd = findCityBySlug("hyderabad")!;
    const blr = findCityBySlug("bengaluru")!;
    const d = distanceKm(hyd.lat, hyd.lng, blr.lat, blr.lng);
    expect(d).toBeGreaterThan(400);
    expect(d).toBeLessThan(700);
  });
});

describe("phone otp helpers", () => {
  it("normalizes 10 digit indian mobiles", () => {
    expect(normalizeIndiaPhone("9876543210")).toBe("+919876543210");
  });
});

describe("face at signin default", () => {
  it("defaults face-at-signin off for mass market", () => {
    expect(env.FACE_VERIFICATION_AT_SIGNIN).toBe(false);
  });
});

describe("deal helpers", () => {
  it("masks phone numbers", () => {
    expect(maskPhone("+919876543210")).toContain("3210");
  });

  it("returns meetup templates", () => {
    expect(meetupSuggestions("Hyderabad").length).toBeGreaterThan(0);
  });
});
