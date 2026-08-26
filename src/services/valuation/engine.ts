import { clamp } from "@/lib/utils";
import { usedShareOfMsrp, resolveVariantMsrp, matchCatalogProduct } from "./catalog";
import { fetchComparables } from "./comparables";
import { computeMobileAttributeAdjustment, type MobileSellAttributes } from "./mobile-attributes";
import { resolveProduct } from "./product-resolver";
import { removeRobustOutliers } from "@/services/fairprice/outliers";
import {
  computeDistribution,
  fairRangeFromDistribution,
  type WeightedPrice,
} from "@/services/fairprice/distribution";
import {
  scoreComparable,
  selectComparablePool,
  summarizeTiers,
  type MatchTarget,
} from "@/services/fairprice/comparable-tiers";
import { freshnessWeight, daysSince } from "@/services/fairprice/freshness";
import {
  ENGINE_VERSION,
  computePriceVerdict,
  conditionGradeToScore,
  type ComparableInput,
  type ValuationAttributes,
  type ValuationFactor,
  type ValuationResult,
} from "./model";

function locationAdjustment(
  city?: string,
  state?: string,
  opts: { citySampleHint?: number } = {},
): number {
  // Hierarchical fallback: do not overfit sparse city (caller may pass sample hint)
  if ((opts.citySampleHint ?? 99) < 3) {
    // Prefer state/national soft factor when city evidence is thin
    if (state && ["Maharashtra", "Karnataka", "Delhi", "Telangana", "Tamil Nadu"].includes(state)) {
      return 1.0;
    }
    return 0.99;
  }
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

function conditionMultiplier(score: number): number {
  return clamp(1 + (score - 70) / 100, 0.7, 1.12);
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

    const mobileAttrs = (attrs.attributes ?? {}) as MobileSellAttributes;
    const storage =
      typeof mobileAttrs.storage === "string"
        ? mobileAttrs.storage
        : typeof attrs.attributes?.storage === "string"
          ? String(attrs.attributes.storage)
          : attrs.storage;
    if (storage) {
      attrs.storage = storage;
      const cat = matchCatalogProduct(attrs.productLabel ?? "");
      if (cat) {
        const variantMsrp = resolveVariantMsrp(cat, storage);
        if (!attrs.msrpInr || Math.abs(attrs.msrpInr - variantMsrp) / variantMsrp > 0.2) {
          if (!attrs.msrpInr) attrs.msrpInr = variantMsrp;
        }
      }
    }

    if (attrs.ageMonths === undefined && typeof mobileAttrs.ageMonths === "number") {
      attrs.ageMonths = mobileAttrs.ageMonths;
    }

    const msrp = attrs.msrpInr && attrs.msrpInr > 0 ? attrs.msrpInr : undefined;
    const conditionScore = attrs.conditionScore!;

    const rawCompsAll =
      comps ??
      (await fetchComparables({
        ...attrs,
        productId: resolved?.productId,
        variantId: resolved?.variantId,
        allowSyntheticComps: attrs.allowSyntheticComps ?? false,
      }));

    const banded = filterCompsToMsrpBand(rawCompsAll, msrp, attrs.askingPriceInr);
    const bandedOrRaw = banded.length >= 2 ? banded : rawCompsAll.filter((c) => !c.isSynthetic);

    const matchTarget: MatchTarget = {
      brand: attrs.brand,
      model: attrs.model,
      variant: storage,
      storage,
      productLabel: attrs.productLabel,
      categorySlug: attrs.categorySlug,
      conditionGrade: attrs.conditionGrade,
      city: attrs.city,
      state: attrs.state,
      area: attrs.area,
    };

    const tiered = bandedOrRaw
      .filter((c) => !c.isSynthetic && c.priceInr > 0)
      .map((c) => scoreComparable(c, matchTarget));
    let pool = selectComparablePool(tiered);
    // Fallback when titles lack brand/model tokens (injected comps / thin DB rows)
    if (pool.length < 2 && tiered.length >= 2) {
      pool = [...tiered]
        .filter((c) => c.tier !== "D" || c.comparableWeight > 0)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 24)
        .map((c) => ({
          ...c,
          comparableWeight: Math.max(c.comparableWeight, 0.25),
        }));
      if (pool.length < 2) {
        pool = tiered.slice(0, 24).map((c) => ({
          ...c,
          comparableWeight: Math.max(c.comparableWeight, 0.2),
          tier: c.tier === "D" ? "C" : c.tier,
        }));
      }
    }
    const tierSummary = summarizeTiers(tiered);

    const citySample = pool.filter(
      (c) => attrs.city && c.city && c.city.toLowerCase() === attrs.city.toLowerCase(),
    ).length;

    // Robust outliers on pool prices
    const outlier = removeRobustOutliers(
      pool.map((c) => c.priceInr),
      { categorySlug: attrs.categorySlug },
    );
    const keptSet = new Set(outlier.kept);
    // When winsorized, kept has same length — match by index loosely via price membership
    const pooledAfterOutlier =
      outlier.method === "winsorize"
        ? pool.map((c, i) => ({
            ...c,
            priceInr: outlier.kept[i] ?? c.priceInr,
          }))
        : pool.filter((c) => keptSet.has(c.priceInr));

    const weighted: WeightedPrice[] = pooledAfterOutlier.map((c) => {
      const ageDays = daysSince(c.createdAt ?? c.soldAt ?? null);
      const w =
        (c.comparableWeight || 0.01) *
        freshnessWeight(ageDays) *
        (c.evidenceType === "SOLD_PRICE" || c.evidenceType === "TRANSACTION_PRICE"
          ? 1.2
          : 1);
      return { price: c.priceInr, weight: w };
    });

    const dist = computeDistribution(weighted);

    // Primary anchor: used share of MRP (never invent prices above new/MRP)
    let msrpAnchor: number | undefined;
    let ageMultForAnchor = 1;
    if (msrp) {
      const share = usedShareOfMsrp(conditionScore);
      ageMultForAnchor = ageDepreciation(attrs.ageMonths ?? 3, attrs.categorySlug);
      msrpAnchor = Math.round(msrp * share * ageMultForAnchor);
      factors.push({
        name: "MRP ceiling",
        impactInr: 0,
        impactPct: 0,
        description: `Original/MRP ₹${msrp.toLocaleString("en-IN")} → used share ${Math.round(share * 100)}% after age`,
      });
    }

    const compsMedian = dist.sampleSize ? dist.weightedMedian : undefined;

    // Blend: when strong comps exist, favour market; otherwise MSRP anchor
    let value: number;
    let marketplaceWeight = 0.3;
    let newRefWeight = 0.7;
    if (msrpAnchor && compsMedian && tierSummary.strongCount >= 3) {
      marketplaceWeight = 0.65;
      newRefWeight = 0.35;
      value = Math.round(msrpAnchor * newRefWeight + compsMedian * marketplaceWeight);
    } else if (msrpAnchor && compsMedian) {
      marketplaceWeight = 0.3;
      newRefWeight = 0.7;
      value = Math.round(msrpAnchor * newRefWeight + compsMedian * marketplaceWeight);
    } else if (msrpAnchor) {
      value = msrpAnchor;
      marketplaceWeight = 0;
      newRefWeight = 1;
    } else if (compsMedian) {
      value = compsMedian;
      marketplaceWeight = 1;
      newRefWeight = 0;
    } else if (attrs.askingPriceInr) {
      value = attrs.askingPriceInr;
    } else {
      // Legacy fallback — FairPrice service must refuse this path without evidence
      value = 15_000;
    }

    const baseMedian = value;
    const p25 = dist.sampleSize ? dist.weightedP25 : Math.round(value * 0.92);
    const p75 = dist.sampleSize ? dist.weightedP75 : Math.round(value * 1.08);

    // LOCATION only on fair value (bounded). Demand/liquidity do NOT inflate fair mid.
    const locMult = locationAdjustment(attrs.city, attrs.state, {
      citySampleHint: citySample,
    });
    const demandMult = 1; // demand reserved for listing strategy in FairPrice layer
    const liquidityMult = 1;
    const softMult = locMult;
    const softImpact = Math.round(value * (softMult - 1));
    const beforeLoc = value;
    value = Math.round(value * softMult);
    factors.push({
      name: "Location",
      impactInr: softImpact,
      impactPct: Math.round((softMult - 1) * 1000) / 10,
      description:
        citySample >= 3 && attrs.city
          ? `City market: ${attrs.city} (n≥3)`
          : attrs.city
            ? `Sparse city sample — using broader market soft factor`
            : "India average location factor",
    });

    let mobileAttrMult = 1;
    if (attrs.categorySlug === "mobiles" || Object.keys(mobileAttrs).length > 0) {
      const adj = computeMobileAttributeAdjustment(mobileAttrs, value);
      if (adj.factors.length) {
        mobileAttrMult = adj.multiplier;
        value = Math.round(value * adj.multiplier);
        factors.push(...adj.factors);
      }
    }

    let usedAboveNewFlag = false;
    if (msrp) {
      const hardCap = Math.round(msrp * 0.92);
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
      if (value > msrp) usedAboveNewFlag = true;
    }

    if (msrp && rawCompsAll.length > 0 && banded.length === 0) {
      factors.push({
        name: "Comparable filter",
        impactInr: 0,
        impactPct: 0,
        description: "Ignored unrelated market comps outside this product's MRP band",
      });
    }

    if (tierSummary.tierA + tierSummary.tierB > 0) {
      factors.push({
        name: "Comparable tiers",
        impactInr: 0,
        impactPct: 0,
        description: `Tier A:${tierSummary.tierA} B:${tierSummary.tierB} C:${tierSummary.tierC} D:${tierSummary.tierD}`,
      });
    }

    let conditionMult = 1;
    if (!msrp) {
      conditionMult = conditionMultiplier(conditionScore);
      const condImpact = Math.round(value * (conditionMult - 1));
      value = Math.round(value * conditionMult);
      factors.push({
        name: "Condition",
        impactInr: condImpact,
        impactPct: Math.round((conditionMult - 1) * 1000) / 10,
        description: `Condition score ${conditionScore}/100 (${attrs.conditionGrade})`,
      });
    }

    const range = fairRangeFromDistribution(value, {
      ...dist,
      sampleSize: dist.sampleSize,
      dispersionPct: dist.dispersionPct || 12,
    });

    let fairMid = Math.max(500, range.fairMid);
    let fairMin = Math.max(400, range.fairLow);
    let fairMax = range.fairHigh;

    if (msrp) {
      const cap = Math.round(msrp * 0.92);
      fairMid = Math.min(fairMid, cap);
      fairMax = Math.min(fairMax, cap);
      fairMin = Math.min(fairMin, fairMid);
      if (fairMin > fairMid) fairMin = Math.round(fairMid * 0.9);
      if (fairMax < fairMid) fairMax = fairMid;
    }

    // Listing strategy multipliers — demand can nudge list/quick, not fair mid
    const d = clamp(attrs.demandScore ?? 0.55, 0, 1);
    const l = clamp(attrs.liquidityScore ?? 0.5, 0, 1);
    const listBump = (d - 0.5) * 0.06;
    let recommendedListing = Math.round(fairMid * (1.04 + listBump));
    let expectedSaleMin = Math.round(fairMid * (0.92 - (1 - l) * 0.02));
    let expectedSaleMax = Math.round(fairMid * (1.02 + listBump * 0.3));
    let quickSale = Math.round(fairMid * (0.86 - (1 - l) * 0.03));

    if (msrp) {
      const cap = Math.round(msrp * 0.92);
      recommendedListing = Math.min(recommendedListing, cap);
      expectedSaleMax = Math.min(expectedSaleMax, cap);
      expectedSaleMin = Math.min(expectedSaleMin, expectedSaleMax);
      quickSale = Math.min(quickSale, Math.round(msrp * 0.8));
    }

    const realCount = pooledAfterOutlier.length;
    const syntheticCount = rawCompsAll.filter((c) => c.isSynthetic).length;
    const sampleFactor = clamp(realCount / 12, 0, 1);
    const msrpConfidenceBoost = msrp ? 0.25 : 0;
    const syntheticPenalty = syntheticCount > 0 && realCount === 0 ? 0.15 : 0;
    const unresolvedPenalty = resolved ? 0 : 0.15;
    const weakTierPenalty = tierSummary.onlyWeak ? 0.12 : 0;
    const priceConfidence = clamp(
      0.4 +
        sampleFactor * 0.2 +
        msrpConfidenceBoost -
        syntheticPenalty -
        unresolvedPenalty -
        weakTierPenalty,
      0.25,
      0.95,
    );

    const marketTrend: ValuationResult["marketTrend"] =
      p75 > p25 * 1.15 ? "up" : p75 < p25 * 1.05 ? "down" : "stable";

    const ageMult = ageDepreciation(attrs.ageMonths ?? 12, attrs.categorySlug);
    const depreciationEstimate = clamp(1 - ageMult, 0, 0.8);

    const compsUsed: ComparableInput[] = pooledAfterOutlier.map((c) => ({
      id: c.id,
      title: c.title,
      priceInr: c.priceInr,
      conditionGrade: c.conditionGrade,
      city: c.city,
      state: c.state,
      ageMonths: c.ageMonths,
      soldAt: c.soldAt,
      createdAt: c.createdAt,
      isSynthetic: false,
      source: c.source,
      evidenceType: c.evidenceType,
      tier: c.tier,
      similarityScore: c.similarityScore,
      weight: c.comparableWeight,
    }));

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
      comparableCount: realCount,
      factors,
      compsUsed,
      baseMedianInr: baseMedian,
      p25Inr: p25,
      p75Inr: p75,
      calculationTrace: {
        msrpAnchorInr: msrpAnchor ?? null,
        compsMedianInr: compsMedian ?? null,
        blendedBaseInr: baseMedian,
        locationMult: locMult,
        demandMult,
        liquidityMult,
        conditionMult: conditionMult * mobileAttrMult,
        softAppliedToValue: beforeLoc !== value || softImpact !== 0,
        demandAppliedToValue: false,
        outlierMethod: outlier.method,
        realComparableCount: realCount,
        syntheticComparableCount: syntheticCount,
        usedAboveNewFlag,
      },
    };
  }
}

export const valuationEngine = new ValuationEngine();
