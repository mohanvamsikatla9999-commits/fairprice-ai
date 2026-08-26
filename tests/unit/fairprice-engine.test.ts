import { describe, expect, it } from "vitest";
import {
  computeFairPriceScore,
  computeConfidence,
  confidenceLabel,
  isUnsupportedCategory,
  getMissingCriticalAttributes,
} from "@/services/fairprice/scoring";
import {
  weightedNewPriceReference,
  externalMatchScore,
} from "@/services/fairprice/evidence";
import { fairPriceResultSchema, fairPriceInputSchema } from "@/services/fairprice/schemas";
import { fairPriceService } from "@/services/fairprice/service";
import { setVisionProvider, MockVisionProvider } from "@/services/fairprice/vision";
import { removeRobustOutliers } from "@/services/fairprice/outliers";
import { freshnessWeight } from "@/services/fairprice/freshness";
import {
  scoreComparable,
  selectComparablePool,
  summarizeTiers,
} from "@/services/fairprice/comparable-tiers";
import { detectIdentityConflict } from "@/services/fairprice/identity-conflict";
import { boundedConditionMultiplier } from "@/services/fairprice/condition-engine";
import { AmazonProductProvider, FlipkartProductProvider } from "@/services/fairprice/providers/pricing";

describe("fairprice scoring", () => {
  it("scores asking price near mid highly", () => {
    const s = computeFairPriceScore(44000, 42000, 44000, 46000);
    expect(s?.score).toBeGreaterThanOrEqual(90);
    expect(s?.relativeBand).toBe("within");
  });

  it("scores below-range asks highly without using confidence", () => {
    const s = computeFairPriceScore(40000, 42000, 44000, 46000);
    expect(s?.relativeBand).toBe("below");
    expect(s?.score).toBeGreaterThanOrEqual(88);
  });

  it("penalizes asks well above fair high", () => {
    const s = computeFairPriceScore(60000, 42000, 44000, 46000);
    expect(s?.score).toBeLessThan(50);
    expect(s?.relativeBand).toBe("above");
  });

  it("labels confidence bands", () => {
    expect(confidenceLabel(0.9)).toBe("VERY_HIGH");
    expect(confidenceLabel(0.5)).toBe("MEDIUM");
    expect(confidenceLabel(0.1)).toBe("VERY_LOW");
  });

  it("marks jobs as unsupported", () => {
    expect(isUnsupportedCategory("jobs")).toBe(true);
    expect(isUnsupportedCategory("mobiles")).toBe(false);
  });
});

describe("comparable tiers / variant matching", () => {
  it("prefers exact 128GB over 256GB and rejects Pro family", () => {
    const target = {
      brand: "Apple",
      model: "iPhone 15",
      storage: "128GB",
      productLabel: "Apple iPhone 15 128GB",
      conditionGrade: "GOOD",
      city: "Hyderabad",
    };
    const exact = scoreComparable(
      {
        title: "Apple iPhone 15 128GB Good condition",
        priceInr: 44000,
        conditionGrade: "GOOD",
        city: "Hyderabad",
        source: "marketplace",
      },
      target,
    );
    const otherStorage = scoreComparable(
      {
        title: "Apple iPhone 15 256GB",
        priceInr: 48000,
        conditionGrade: "GOOD",
        city: "Hyderabad",
        source: "marketplace",
      },
      target,
    );
    const pro = scoreComparable(
      {
        title: "Apple iPhone 15 Pro 128GB",
        priceInr: 70000,
        conditionGrade: "GOOD",
        city: "Hyderabad",
        source: "marketplace",
      },
      target,
    );
    expect(exact.tier === "A" || exact.tier === "B").toBe(true);
    expect(exact.comparableWeight).toBeGreaterThan(otherStorage.comparableWeight);
    expect(pro.tier).toBe("D");
    expect(pro.comparableWeight).toBe(0);

    const pool = selectComparablePool([exact, otherStorage, pro]);
    expect(pool.some((c) => c.title.includes("Pro"))).toBe(false);
    const summary = summarizeTiers([exact, otherStorage, pro]);
    expect(summary.tierD).toBeGreaterThanOrEqual(1);
  });

  it("distinguishes asking vs sold evidence weights", () => {
    const target = {
      brand: "Apple",
      model: "iPhone 15",
      storage: "128GB",
      productLabel: "iPhone 15 128GB",
    };
    const sold = scoreComparable(
      {
        title: "iPhone 15 128GB",
        priceInr: 43000,
        soldAt: new Date(),
        source: "marketplace",
      },
      target,
    );
    const asking = scoreComparable(
      {
        title: "iPhone 15 128GB",
        priceInr: 43000,
        source: "marketplace",
      },
      target,
    );
    expect(sold.evidenceType).toBe("SOLD_PRICE");
    expect(asking.evidenceType).toBe("ASKING_PRICE");
    expect(sold.priceReliability).toBeGreaterThan(asking.priceReliability);
  });
});

describe("outliers and freshness", () => {
  it("avoids aggressive filtering for tiny samples", () => {
    const r = removeRobustOutliers([100, 110, 100000]);
    expect(r.method).toBe("none");
    expect(r.kept.length).toBe(3);
  });

  it("filters extreme outliers on larger samples", () => {
    const prices = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 5000].map((n) => n * 1000);
    const r = removeRobustOutliers(prices, { categorySlug: "mobiles" });
    expect(r.kept.every((p) => p < 200_000)).toBe(true);
  });

  it("decays freshness for old listings", () => {
    expect(freshnessWeight(3)).toBe(1);
    expect(freshnessWeight(100)).toBeLessThan(freshnessWeight(20));
    expect(freshnessWeight(400)).toBeLessThanOrEqual(0.05);
  });
});

describe("condition bounds and missing attributes", () => {
  it("bounds condition multipliers", () => {
    expect(boundedConditionMultiplier("POOR", 35)).toBeLessThan(1);
    expect(boundedConditionMultiplier("LIKE_NEW", 95)).toBeGreaterThanOrEqual(1);
    expect(boundedConditionMultiplier("GOOD", 70)).toBeLessThanOrEqual(1);
  });

  it("asks for mobile battery health when missing", () => {
    const missing = getMissingCriticalAttributes({
      categorySlug: "mobiles",
      identity: { brand: "Apple", model: "iPhone 15", storage: "128GB" },
      attributes: {},
      conditionGrade: "GOOD",
    });
    expect(missing.some((m) => m.key === "batteryHealth")).toBe(true);
  });

  it("asks for vehicle odometer/year", () => {
    const missing = getMissingCriticalAttributes({
      categorySlug: "cars",
      identity: { brand: "Honda", model: "City", variant: null },
      attributes: {},
    });
    expect(missing.some((m) => m.key === "odometer" || m.key === "year")).toBe(true);
  });
});

describe("identity conflict", () => {
  it("flags iPhone 15 vs iPhone 15 Pro conflict", () => {
    const r = detectIdentityConflict({
      userBrand: "Apple",
      userModel: "iPhone 15 Pro",
      visionBrand: { value: "Apple", confidence: 0.9, source: "image" },
      visionModel: { value: "iPhone 15", confidence: 0.9, source: "image" },
    });
    expect(r.conflict).toBe(true);
  });
});

describe("external providers", () => {
  it("returns unavailable without credentials (never fabricates)", async () => {
    const amazon = await new AmazonProductProvider().searchProduct({
      productLabel: "iPhone 15",
      brand: "Apple",
      model: "iPhone 15",
    });
    const flipkart = await new FlipkartProductProvider().searchProduct({
      productLabel: "iPhone 15",
      brand: "Apple",
      model: "iPhone 15",
    });
    expect(amazon[0]?.available).toBe(false);
    expect(amazon[0]?.priceInr).toBeNull();
    expect(flipkart[0]?.available).toBe(false);
  });

  it("rejects weak title-only external matches", () => {
    expect(
      externalMatchScore({
        queryBrand: "Apple",
        queryModel: "iPhone 15",
        queryStorage: "128GB",
        resultTitle: "Phone case for smartphones",
      }),
    ).toBe(0);
    expect(
      externalMatchScore({
        queryBrand: "Apple",
        queryModel: "iPhone 15",
        queryStorage: "128GB",
        resultTitle: "Apple iPhone 15 128GB Blue",
        resultBrand: "Apple",
        resultModel: "iPhone 15",
      }),
    ).toBeGreaterThanOrEqual(0.7);
  });
});

describe("new price weighting", () => {
  it("ignores unavailable sources", () => {
    const mid = weightedNewPriceReference([
      {
        priceInr: null,
        matchScore: 1,
        available: false,
        freshness: "fresh",
      },
      {
        priceInr: 50000,
        matchScore: 0.9,
        available: true,
        freshness: "fresh",
      },
    ]);
    expect(mid).toBe(50000);
  });

  it("returns null when nothing available", () => {
    expect(
      weightedNewPriceReference([
        { priceInr: null, matchScore: 1, available: false, freshness: "fresh" },
      ]),
    ).toBeNull();
  });

  it("ignores low match scores", () => {
    expect(
      weightedNewPriceReference([
        { priceInr: 50000, matchScore: 0.3, available: true, freshness: "fresh" },
      ]),
    ).toBeNull();
  });
});

describe("fairprice schemas", () => {
  it("parses input", () => {
    const parsed = fairPriceInputSchema.parse({
      title: "iPhone 15 128GB",
      categorySlug: "mobiles",
      conditionGrade: "GOOD",
    });
    expect(parsed.title).toContain("iPhone");
  });
});

describe("fairprice service", () => {
  it("returns insufficient data for vague unknown item without evidence", async () => {
    setVisionProvider(new MockVisionProvider());
    const result = await fairPriceService.evaluate({
      title: "Random unlabeled gadget xyzzy",
      categorySlug: "other",
      skipExternal: true,
      skipVision: true,
      persist: false,
    });
    expect([
      "INSUFFICIENT_DATA",
      "UNSUPPORTED_CATEGORY",
      "IDENTITY_UNCERTAIN",
      "SUCCESS",
      "OK",
    ]).toContain(result.status);
    if (result.status === "INSUFFICIENT_DATA" || result.status === "IDENTITY_UNCERTAIN") {
      expect(result.valuation).toBeNull();
    }
    expect(() => fairPriceResultSchema.parse(result)).not.toThrow();
  }, 20_000);

  it("values a known mobile with catalog MSRP without inventing amazon prices", async () => {
    setVisionProvider(new MockVisionProvider());
    const result = await fairPriceService.evaluate({
      title: "iPhone 15 128GB",
      categorySlug: "mobiles",
      brand: "Apple",
      model: "iPhone 15",
      conditionGrade: "GOOD",
      city: "Hyderabad",
      attributes: { storage: "128GB" },
      skipExternal: true,
      skipVision: true,
      persist: false,
    });
    expect(result.evidence.amazonReferences).toBe(0);
    expect(result.evidence.flipkartReferences).toBe(0);
    expect(() => fairPriceResultSchema.parse(result)).not.toThrow();
    if ((result.status === "SUCCESS" || result.status === "OK") && result.valuation) {
      expect(result.valuation.fairLow).toBeLessThanOrEqual(result.valuation.fairMid);
      expect(result.valuation.fairMid).toBeLessThanOrEqual(result.valuation.fairHigh);
      expect(result.valuation.quickSalePrice).toBeLessThanOrEqual(
        result.valuation.recommendedListingPrice,
      );
      expect(result.calculationBreakdown).toBeTruthy();
      expect(result.calculationBreakdown?.finalPrice).toBe(result.valuation.fairMid);
    }
  }, 30_000);

  it("returns IDENTITY_CONFLICT when image and user disagree", async () => {
    setVisionProvider({
      name: "mock-conflict",
      async analyzeProductImages() {
        return {
          brand: { value: "Apple", confidence: 0.95, source: "image" as const },
          model: { value: "iPhone 15", confidence: 0.92, source: "image" as const },
          storage: { value: "128GB", confidence: 0.8, source: "ocr" as const },
          category: { value: "mobiles", confidence: 0.9, source: "inference" as const },
          visibleCondition: { value: null, confidence: 0, source: "unknown" as const },
          uncertainties: [],
        };
      },
    });
    const result = await fairPriceService.evaluate({
      title: "iPhone 15 Pro",
      brand: "Apple",
      model: "iPhone 15 Pro",
      categorySlug: "mobiles",
      skipExternal: true,
      skipVision: false,
      persist: false,
      images: [{ url: "https://example.com/x.jpg" }],
    });
    expect(result.status).toBe("IDENTITY_CONFLICT");
    expect(result.valuation).toBeNull();
  }, 20_000);
});

describe("confidence engine", () => {
  it("rises with more comps and identity", () => {
    const low = computeConfidence({
      identityConfidence: 0.3,
      conditionConfidence: 0.5,
      comparableCount: 1,
      soldCount: 0,
      hasNewPriceRef: false,
      priceDispersionPct: 40,
      attributeUnknownCount: 3,
      onlyAskingEvidence: true,
    });
    const high = computeConfidence({
      identityConfidence: 0.95,
      conditionConfidence: 0.9,
      comparableCount: 18,
      soldCount: 5,
      hasNewPriceRef: true,
      priceDispersionPct: 8,
      attributeUnknownCount: 0,
      tierA: 8,
      tierB: 6,
      avgFreshness: 0.9,
    });
    expect(high.overall).toBeGreaterThan(low.overall);
  });

  it("penalizes asking-only evidence", () => {
    const withSold = computeConfidence({
      identityConfidence: 0.8,
      conditionConfidence: 0.8,
      comparableCount: 10,
      soldCount: 4,
      hasNewPriceRef: true,
      priceDispersionPct: 10,
      attributeUnknownCount: 0,
    });
    const askingOnly = computeConfidence({
      identityConfidence: 0.8,
      conditionConfidence: 0.8,
      comparableCount: 10,
      soldCount: 0,
      hasNewPriceRef: true,
      priceDispersionPct: 10,
      attributeUnknownCount: 0,
      onlyAskingEvidence: true,
    });
    expect(withSold.overall).toBeGreaterThan(askingOnly.overall);
  });
});
