import { clamp } from "@/lib/utils";
import { usedShareOfMsrp, resolveVariantMsrp, matchCatalogProduct } from "./catalog";
import { fetchComparables } from "./comparables";
import { computeMobileAttributeAdjustment, type MobileSellAttributes } from "./mobile-attributes";
import { resolveProduct } from "./product-resolver";
import {
  ENGINE_VERSION,
  computePriceVerdict,
  conditionGradeToScore,
  type ComparableInput,
  type ValuationAttributes,
  type ValuationFactor,
  type ValuationResult,
} from "./model";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

function median(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 0.5);
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return [...prices];
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const filtered = prices.filter((p) => p >= low && p <= high);
  return filtered.length >= 3 ? filtered : prices;
}

function conditionMultiplier(score: number): number {
  return clamp(1 + (score - 70) / 100, 0.7, 1.12);
}

function ageDepreciation(ageMonths: number | undefined, categorySlug?: string): number {
  const age = Math.max(0, ageMonths ?? 12);
  const annual =
    categorySlug === "cars" || categorySlug === "bikes"
      ? 0.12
      : categorySlug === "mobiles" || categorySlug === "laptops"
        ? 0.22
        : 0.15;
  const years = age / 12;
  return clamp(Math.pow(1 - annual, years), 0.35, 1);
}

function locationAdjustment(city?: string, state?: string): number {
  const metro = new Set([
    "bengaluru",
    "bangalore",
    "mumbai",
    "delhi",
    "hyderabad",
    "chennai",
    "pune",
    "kolkata",
    "gurugram",
    "noida",
    "ahmedabad",
  ]);
  const c = (city ?? "").toLowerCase();
  if (metro.has(c)) return 1.02;
  if (state && ["Maharashtra", "Karnataka", "Delhi", "Telangana", "Tamil Nadu"].includes(state)) {
    return 1.0;
  }
  return 0.98;
}

function demandAdjustment(demandScore?: number): number {
  const d = clamp(demandScore ?? 0.55, 0, 1);
  return 0.95 + d * 0.08;
}

function liquidityAdjustment(liquidity?: number): number {
  const l = clamp(liquidity ?? 0.5, 0, 1);
  return 0.96 + l * 0.06;
}

function normalizeAttributes(input: ValuationAttributes): ValuationAttributes {
  const conditionScore =
    input.conditionScore ?? conditionGradeToScore(input.conditionGrade);
  return {
    ...input,
    conditionScore: clamp(conditionScore, 0, 100),
    ageMonths: input.ageMonths !== undefined ? Math.max(0, input.ageMonths) : undefined,
    demandScore: input.demandScore !== undefined ? clamp(input.demandScore, 0, 1) : 0.55,
    liquidityScore:
      input.liquidityScore !== undefined ? clamp(input.liquidityScore, 0, 1) : 0.5,
    productLabel:
      input.productLabel?.trim() ||
      [input.brand, input.model].filter(Boolean).join(" ").trim() ||
      "Item",
    city: input.city?.trim() || undefined,
    state: input.state?.trim() || undefined,
  };
}

/**
 * Filter comps that cannot possibly belong to this product's price band.
 * A Poco M7 (MRP ₹12,499) must never use iPhone comps.
 */
function filterCompsToMsrpBand(
  comps: ComparableInput[],
  msrpInr?: number,
  askingPriceInr?: number,
): ComparableInput[] {
  const anchor = msrpInr ?? askingPriceInr;
  if (!anchor || anchor <= 0) return comps;
  const low = Math.round(anchor * 0.25);
  const high = Math.round(anchor * 1.05);
  const filtered = comps.filter((c) => c.priceInr >= low && c.priceInr <= high);
  return filtered.length >= 2 ? filtered : [];
}

export class ValuationEngine {
  async value(
    input: ValuationAttributes,
    comps?: ComparableInput[],
  ): Promise<ValuationResult> {
    const attrs = normalizeAttributes(input);
    const factors: ValuationFactor[] = [];

    // Resolve real product + MSRP whenever possible
    const resolved = await resolveProduct({
      productLabel: attrs.productLabel,
      brand: attrs.brand,
      model: attrs.model,
      categorySlug: attrs.categorySlug,
      msrpInr: attrs.msrpInr,
    });

    if (resolved) {
      attrs.brand = resolved.brand;
      attrs.model = resolved.model;
      attrs.productLabel = resolved.productLabel;
      attrs.categorySlug = attrs.categorySlug ?? resolved.categorySlug;
      attrs.msrpInr = attrs.msrpInr && attrs.msrpInr > 0 ? attrs.msrpInr : resolved.msrpInr;
      if (attrs.msrpInr && resolved.msrpInr && attrs.msrpInr > resolved.msrpInr * 1.5) {
        attrs.msrpInr = resolved.msrpInr;
      }
    }

    // Storage-specific MRP from catalog variants (e.g. POCO M7 64GB vs 128GB)
    const mobileAttrs = (attrs.attributes ?? {}) as MobileSellAttributes;
    const storage =
      typeof mobileAttrs.storage === "string"
        ? mobileAttrs.storage
        : typeof attrs.attributes?.storage === "string"
          ? String(attrs.attributes.storage)
          : undefined;
    if (storage) {
      const cat = matchCatalogProduct(attrs.productLabel ?? "");
      if (cat) {
        const variantMsrp = resolveVariantMsrp(cat, storage);
        if (!attrs.msrpInr || Math.abs(attrs.msrpInr - variantMsrp) / variantMsrp > 0.2) {
          // Prefer user MRP when close; otherwise use variant MSRP
          if (!attrs.msrpInr) attrs.msrpInr = variantMsrp;
        }
      }
    }

    // Age from mobile attributes if not set at top level
    if (attrs.ageMonths === undefined && typeof mobileAttrs.ageMonths === "number") {
      attrs.ageMonths = mobileAttrs.ageMonths;
    }

    const msrp = attrs.msrpInr && attrs.msrpInr > 0 ? attrs.msrpInr : undefined;
    const conditionScore = attrs.conditionScore!;

    const rawCompsAll = comps ?? (await fetchComparables({
      ...attrs,
      productId: resolved?.productId,
      variantId: resolved?.variantId,
    }));
    const banded = filterCompsToMsrpBand(rawCompsAll, msrp, attrs.askingPriceInr);
    const rawComps = banded.length >= 2 ? banded : [];

    // Primary anchor: used share of MRP (never invent prices above new/MRP)
    let msrpAnchor: number | undefined;
    if (msrp) {
      const share = usedShareOfMsrp(conditionScore);
      // Unknown age: assume relatively recent (3 months) — don't punish brand-new resales
      const ageMult = ageDepreciation(attrs.ageMonths ?? 3, attrs.categorySlug);
      msrpAnchor = Math.round(msrp * share * ageMult);
      factors.push({
        name: "MRP ceiling",
        impactInr: 0,
        impactPct: 0,
        description: `Original/MRP ₹${msrp.toLocaleString("en-IN")} → used share ${Math.round(share * 100)}% after age`,
      });
    }

    const prices = removeOutliers(rawComps.map((c) => c.priceInr).filter((p) => p > 0));
    const sorted = [...prices].sort((a, b) => a - b);
    const compsMedian = sorted.length ? Math.round(median(sorted)) : undefined;

    // Blend: MSRP anchor dominates when available; comps only if in-band
    let value: number;
    if (msrpAnchor && compsMedian) {
      value = Math.round(msrpAnchor * 0.7 + compsMedian * 0.3);
    } else if (msrpAnchor) {
      value = msrpAnchor;
    } else if (compsMedian) {
      value = compsMedian;
    } else if (attrs.askingPriceInr) {
      value = attrs.askingPriceInr;
    } else {
      value = 15_000;
    }

    const baseMedian = value;
    const p25 = sorted.length
      ? Math.round(percentile(sorted, 0.25))
      : Math.round(value * 0.92);
    const p75 = sorted.length
      ? Math.round(percentile(sorted, 0.75))
      : Math.round(value * 1.08);

    // Soft location/demand/liquidity — keep small so we don't explode past MRP
    const locMult = locationAdjustment(attrs.city, attrs.state);
    const demandMult = demandAdjustment(attrs.demandScore);
    const liqMult = liquidityAdjustment(attrs.liquidityScore);
    const softMult = locMult * demandMult * liqMult;
    const softImpact = Math.round(value * (softMult - 1));
    value = Math.round(value * softMult);
    factors.push({
      name: "Market soft factors",
      impactInr: softImpact,
      impactPct: Math.round((softMult - 1) * 1000) / 10,
      description: attrs.city ? `Market: ${attrs.city}` : "India average demand/liquidity",
    });

    // Mobile accessories / detailed condition adjustments
    if (attrs.categorySlug === "mobiles" || Object.keys(mobileAttrs).length > 0) {
      const adj = computeMobileAttributeAdjustment(mobileAttrs, value);
      if (adj.factors.length) {
        value = Math.round(value * adj.multiplier);
        factors.push(...adj.factors);
      }
    }

    // HARD RULE: used fair value must stay below MRP / purchase price
    if (msrp) {
      const hardCap = Math.round(msrp * 0.92); // never recommend selling used above 92% of MRP
      const likeNewCap = Math.round(msrp * usedShareOfMsrp(Math.max(conditionScore, 90)));
      const ceiling = Math.min(hardCap, Math.max(likeNewCap, Math.round(msrp * 0.5)));
      if (value > ceiling) {
        factors.push({
          name: "Used-price ceiling",
          impactInr: ceiling - value,
          impactPct: Math.round(((ceiling - value) / Math.max(value, 1)) * 1000) / 10,
          description: `Capped below MRP ₹${msrp.toLocaleString("en-IN")} (used goods cannot exceed new/original price)`,
        });
        value = ceiling;
      }
    }

    // If comps were discarded as wrong band, note confidence hit
    if (msrp && rawCompsAll.length > 0 && rawComps.length === 0) {
      factors.push({
        name: "Comparable filter",
        impactInr: 0,
        impactPct: 0,
        description: "Ignored unrelated market comps outside this product's MRP band",
      });
    }

    // Keep condition factor for explainability when comps-driven (already in MSRP share)
    if (!msrp) {
      const condMult = conditionMultiplier(conditionScore);
      const condImpact = Math.round(value * (condMult - 1));
      value = Math.round(value * condMult);
      factors.push({
        name: "Condition",
        impactInr: condImpact,
        impactPct: Math.round((condMult - 1) * 1000) / 10,
        description: `Condition score ${conditionScore}/100 (${attrs.conditionGrade})`,
      });
    }

    const spread = Math.max(
      Math.abs(p75 - p25),
      Math.round((msrp ?? baseMedian) * 0.08),
    );
    let fairMid = Math.max(500, value);
    let fairMin = Math.max(400, Math.round(fairMid - spread * 0.4));
    let fairMax = Math.round(fairMid + spread * 0.35);

    if (msrp) {
      const cap = Math.round(msrp * 0.92);
      fairMid = Math.min(fairMid, cap);
      fairMax = Math.min(fairMax, cap);
      fairMin = Math.min(fairMin, fairMid);
      // Ensure ordering
      if (fairMin > fairMid) fairMin = Math.round(fairMid * 0.9);
      if (fairMax < fairMid) fairMax = fairMid;
    }

    let recommendedListing = Math.round(fairMid * 1.04);
    let expectedSaleMin = Math.round(fairMid * 0.92);
    let expectedSaleMax = Math.round(fairMid * 1.02);
    let quickSale = Math.round(fairMid * 0.86);

    if (msrp) {
      const cap = Math.round(msrp * 0.92);
      recommendedListing = Math.min(recommendedListing, cap);
      expectedSaleMax = Math.min(expectedSaleMax, cap);
      expectedSaleMin = Math.min(expectedSaleMin, expectedSaleMax);
      quickSale = Math.min(quickSale, Math.round(msrp * 0.8));
    }

    const sampleFactor = clamp(sorted.length / 12, 0, 1);
    const msrpConfidenceBoost = msrp ? 0.25 : 0;
    const syntheticPenalty =
      rawComps.length > 0 && rawComps.every((c) => c.isSynthetic) ? 0.1 : 0;
    const unresolvedPenalty = resolved ? 0 : 0.15;
    const priceConfidence = clamp(
      0.4 + sampleFactor * 0.2 + msrpConfidenceBoost - syntheticPenalty - unresolvedPenalty,
      0.25,
      0.95,
    );

    const marketTrend: ValuationResult["marketTrend"] =
      p75 > p25 * 1.15 ? "up" : p75 < p25 * 1.05 ? "down" : "stable";

    const ageMult = ageDepreciation(attrs.ageMonths ?? 12, attrs.categorySlug);
    const depreciationEstimate = clamp(1 - ageMult, 0, 0.8);

    return {
      engineVersion: ENGINE_VERSION,
      productLabel: attrs.productLabel!,
      fairValueMinInr: fairMin,
      fairValueMaxInr: fairMax,
      fairValueMidInr: fairMid,
      recommendedListingInr: recommendedListing,
      expectedSaleMinInr: expectedSaleMin,
      expectedSaleMaxInr: expectedSaleMax,
      quickSaleInr: quickSale,
      conditionScore,
      priceConfidence: Math.round(priceConfidence * 1000) / 1000,
      marketDemandScore: attrs.demandScore!,
      marketLiquidity: attrs.liquidityScore!,
      depreciationEstimate: Math.round(depreciationEstimate * 1000) / 1000,
      marketTrend,
      verdict: computePriceVerdict(attrs.askingPriceInr, fairMid, fairMin, fairMax),
      negotiationMinInr: Math.round(fairMid * 0.88),
      negotiationMaxInr: Math.min(
        Math.round(fairMid * 0.98),
        msrp ? Math.round(msrp * 0.9) : Math.round(fairMid * 0.98),
      ),
      comparableCount: sorted.length,
      factors,
      compsUsed: rawComps.length ? rawComps : rawCompsAll.slice(0, 0),
      baseMedianInr: baseMedian,
      p25Inr: p25,
      p75Inr: p75,
    };
  }
}

export const valuationEngine = new ValuationEngine();
