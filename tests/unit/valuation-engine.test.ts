import { describe, expect, it } from "vitest";
import { ValuationEngine } from "@/services/valuation/engine";
import type { ComparableInput, ValuationAttributes } from "@/services/valuation/model";

const engine = new ValuationEngine();

const baseAttrs: ValuationAttributes = {
  categorySlug: "mobiles",
  brand: "Apple",
  model: "iPhone 14",
  productLabel: "Apple iPhone 14 128GB",
  conditionGrade: "GOOD",
  conditionScore: 70,
  ageMonths: 18,
  city: "Bengaluru",
  state: "Karnataka",
  demandScore: 0.6,
  liquidityScore: 0.55,
};

function compsAround(mid: number, count = 12): ComparableInput[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Comp ${i}`,
    priceInr: Math.round(mid * (0.9 + (i % 5) * 0.04)),
    conditionGrade: "GOOD" as const,
    city: "Bengaluru",
    isSynthetic: false,
    source: "test",
  }));
}

describe("ValuationEngine", () => {
  it("marks underpriced asking prices", async () => {
    const comps = compsAround(50_000);
    const result = await engine.value(
      { ...baseAttrs, askingPriceInr: 22_000 },
      comps,
    );
    expect(result.verdict).toBe("UNDERPRICED");
    expect(result.fairValueMidInr).toBeGreaterThan(0);
  });

  it("marks fair asking prices", async () => {
    const comps = compsAround(50_000);
    const preview = await engine.value({ ...baseAttrs }, comps);
    const result = await engine.value(
      { ...baseAttrs, askingPriceInr: preview.fairValueMidInr },
      comps,
    );
    expect(result.verdict).toBe("FAIR");
  });

  it("marks overpriced asking prices", async () => {
    const comps = compsAround(50_000);
    const result = await engine.value(
      { ...baseAttrs, askingPriceInr: 90_000 },
      comps,
    );
    expect(result.verdict).toBe("OVERPRICED");
  });

  it("reduces fair mid for poor condition vs excellent", async () => {
    const comps = compsAround(60_000);
    const poor = await engine.value(
      {
        ...baseAttrs,
        conditionGrade: "POOR",
        conditionScore: 35,
        askingPriceInr: 50_000,
      },
      comps,
    );
    const excellent = await engine.value(
      {
        ...baseAttrs,
        conditionGrade: "EXCELLENT",
        conditionScore: 85,
        askingPriceInr: 50_000,
      },
      comps,
    );
    expect(excellent.fairValueMidInr).toBeGreaterThan(poor.fairValueMidInr);
    expect(poor.conditionScore).toBe(35);
    expect(excellent.conditionScore).toBe(85);
  });

  it("handles no comparables with fallback median", async () => {
    const result = await engine.value(
      { ...baseAttrs, askingPriceInr: 40_000 },
      [],
    );
    expect(result.comparableCount).toBe(0);
    expect(result.fairValueMidInr).toBeGreaterThan(0);
    expect(result.verdict).toBeDefined();
  });

  it("lowers confidence when only synthetic comps exist", async () => {
    const synthetic = compsAround(45_000, 8).map((c) => ({
      ...c,
      isSynthetic: true,
    }));
    const real = compsAround(45_000, 16);
    const synResult = await engine.value({ ...baseAttrs }, synthetic);
    const realResult = await engine.value({ ...baseAttrs }, real);
    expect(synResult.priceConfidence).toBeLessThanOrEqual(realResult.priceConfidence);
    expect(synResult.priceConfidence).toBeLessThan(0.95);
  });

  it("never values a used POCO M7 above its MRP of ₹12,499", async () => {
    // Poison comps: expensive unrelated phones that previously broke valuation
    const poison = compsAround(55_000, 12).map((c, i) => ({
      ...c,
      title: `iPhone poison ${i}`,
    }));
    const result = await engine.value(
      {
        categorySlug: "mobiles",
        productLabel: "POCO M7",
        brand: "POCO",
        model: "M7",
        conditionGrade: "GOOD",
        conditionScore: 70,
        ageMonths: 4,
        city: "Hyderabad",
        askingPriceInr: 10_000,
        msrpInr: 12_499,
      },
      poison,
    );

    expect(result.productLabel.toLowerCase()).toContain("poco");
    expect(result.fairValueMidInr).toBeLessThan(12_499);
    expect(result.fairValueMaxInr).toBeLessThanOrEqual(Math.round(12_499 * 0.92));
    expect(result.recommendedListingInr).toBeLessThanOrEqual(Math.round(12_499 * 0.92));
    expect(result.recommendedListingInr).toBeGreaterThan(5_000);
    expect(result.recommendedListingInr).toBeLessThan(12_000);
    // Asking 10k near a realistic used band should not be wildly "underpriced" into 30k territory
    expect(result.fairValueMidInr).toBeLessThan(11_500);
  });

  it("uses MRP ceiling even when asking price alone would pull comps upward", async () => {
    const result = await engine.value(
      {
        categorySlug: "mobiles",
        productLabel: "POCO M7 128GB",
        conditionGrade: "EXCELLENT",
        conditionScore: 85,
        ageMonths: 2,
        msrpInr: 12_499,
        askingPriceInr: 10_000,
      },
      [],
    );
    expect(result.fairValueMaxInr).toBeLessThanOrEqual(Math.round(12_499 * 0.92));
    expect(result.verdict === "FAIR" || result.verdict === "UNDERPRICED" || result.verdict === "SLIGHTLY_HIGH").toBe(
      true,
    );
  });
});
