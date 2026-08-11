import { describe, expect, it } from "vitest";
import { INDIA_MOBILE_CATALOG, matchCatalogProduct } from "@/services/valuation/catalog";
import { computeMobileAttributeAdjustment } from "@/services/valuation/mobile-attributes";
import { ValuationEngine } from "@/services/valuation/engine";

describe("full mobile catalog", () => {
  it("includes a large India mobile catalog", () => {
    expect(INDIA_MOBILE_CATALOG.length).toBeGreaterThanOrEqual(100);
    expect(matchCatalogProduct("poco m7")?.msrpInr).toBe(12499);
    expect(matchCatalogProduct("iphone 15")?.brand).toBe("Apple");
    expect(matchCatalogProduct("galaxy s24 ultra")?.model.toLowerCase()).toContain("s24");
  });

  it("raises value when box+charger+invoice+warranty are present", () => {
    const base = 9000;
    const withKit = computeMobileAttributeAdjustment(
      {
        boxAvailable: true,
        chargerAvailable: true,
        invoiceAvailable: true,
        warranty: "Manufacturer warranty left",
        warrantyMonthsLeft: 8,
        batteryHealth: 95,
        screenCondition: "Perfect",
        bodyCondition: "Perfect",
        repairHistory: "Never repaired",
      },
      base,
    );
    const bare = computeMobileAttributeAdjustment(
      {
        boxAvailable: false,
        chargerAvailable: false,
        invoiceAvailable: false,
        warranty: "No warranty",
        batteryHealth: 72,
        screenCondition: "Cracked / damaged",
        bodyCondition: "Heavy wear",
        repairHistory: "Major repair",
      },
      base,
    );
    expect(withKit.multiplier).toBeGreaterThan(1);
    expect(bare.multiplier).toBeLessThan(0.9);
    expect(withKit.multiplier).toBeGreaterThan(bare.multiplier);
  });

  it("values POCO M7 with full sell attributes under MRP", async () => {
    const engine = new ValuationEngine();
    const result = await engine.value({
      categorySlug: "mobiles",
      productLabel: "POCO M7",
      conditionGrade: "GOOD",
      askingPriceInr: 10000,
      msrpInr: 12499,
      ageMonths: 3,
      attributes: {
        storage: "128GB",
        ram: "6GB",
        boxAvailable: true,
        chargerAvailable: true,
        invoiceAvailable: true,
        warranty: "Manufacturer warranty left",
        warrantyMonthsLeft: 6,
        batteryHealth: 92,
        screenCondition: "Perfect",
        bodyCondition: "Minor marks",
        repairHistory: "Never repaired",
      },
    });
    expect(result.recommendedListingInr).toBeLessThan(12499);
    expect(result.fairValueMidInr).toBeGreaterThan(7000);
    expect(result.fairValueMidInr).toBeLessThan(11500);
    expect(result.factors.some((f) => /box|charger|warranty|battery|invoice/i.test(f.name))).toBe(
      true,
    );
  });
});
