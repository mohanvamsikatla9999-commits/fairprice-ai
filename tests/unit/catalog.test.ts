import { describe, expect, it } from "vitest";
import { matchCatalogProduct, usedShareOfMsrp } from "@/services/valuation/catalog";

describe("product catalog", () => {
  it("matches POCO M7 from natural queries", () => {
    expect(matchCatalogProduct("poco m7")?.msrpInr).toBe(12499);
    expect(matchCatalogProduct("POCO M7 128GB")?.model).toBe("M7");
    expect(matchCatalogProduct("xiaomi poco m7")?.brand).toBe("POCO");
  });

  it("does not confuse budget phones with premium models", () => {
    expect(matchCatalogProduct("poco m7")?.msrpInr).toBeLessThan(20000);
    expect(matchCatalogProduct("iphone 14")?.msrpInr).toBeGreaterThan(50000);
  });

  it("maps condition to used share of MRP below 1.0", () => {
    expect(usedShareOfMsrp(95)).toBeLessThan(1);
    expect(usedShareOfMsrp(70)).toBeLessThan(usedShareOfMsrp(95));
    expect(usedShareOfMsrp(35)).toBeLessThan(usedShareOfMsrp(70));
  });
});
