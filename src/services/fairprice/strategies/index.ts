import type { FairPriceInput, ProductIdentity } from "../schemas";
import { boundedConditionMultiplier } from "../condition-engine";
import { getMissingCriticalAttributes } from "../attributes";

export type StrategyId =
  | "mobile"
  | "laptop"
  | "tv"
  | "camera"
  | "car"
  | "bike"
  | "furniture"
  | "property"
  | "generic"
  | "unsupported";

export type StrategyContext = {
  categorySlug?: string | null;
  identity: ProductIdentity;
  input: FairPriceInput;
  baseMid: number;
  newPriceReferenceInr: number | null;
  demandScore: number;
  liquidityScore: number;
  conditionScore: number;
  conditionGrade: string;
  ageMonths?: number;
};

export type StrategyResult = {
  strategyId: StrategyId;
  /** Adjustments applied to fair mid (bounded). Demand excluded from value. */
  valueMultiplier: number;
  /** Listing strategy only — does not change fair mid. */
  listing: {
    recommendedListingMult: number;
    expectedSellingMult: number;
    quickSaleMult: number;
    expectedDaysToSell: number | null;
  };
  missingCritical: ReturnType<typeof getMissingCriticalAttributes>;
  notes: string[];
  /** If true, caller should prefer INSUFFICIENT_DATA when comps are weak. */
  requiresStrongEvidence: boolean;
  propertyDisclaimer: boolean;
};

function resolveStrategyId(slug?: string | null): StrategyId {
  const s = (slug ?? "").toLowerCase();
  if (!s) return "generic";
  if (s.startsWith("jobs") || s.includes("service")) return "unsupported";
  if (s.includes("mobile")) return "mobile";
  if (s.includes("laptop") || s.includes("computer")) return "laptop";
  if (s.includes("tv") || s.includes("television")) return "tv";
  if (s.includes("camera")) return "camera";
  if (s === "cars" || (s.includes("car") && !s.includes("care"))) return "car";
  if (s.includes("bike") || s.includes("scooter")) return "bike";
  if (s.includes("furniture")) return "furniture";
  if (s.includes("propert") || s.includes("lands") || s.includes("pg-")) return "property";
  return "generic";
}

function demandListingTweaks(demand: number, liquidity: number) {
  // Demand affects speed / list strategy only (±4% list, not fair mid)
  const d = Math.max(0, Math.min(1, demand));
  const l = Math.max(0, Math.min(1, liquidity));
  const listBump = (d - 0.5) * 0.06; // -3%..+3%
  const quickCut = 0.86 - (1 - l) * 0.04;
  const days =
    l >= 0.7 && d >= 0.6 ? 7 : l >= 0.5 ? 14 : l >= 0.35 ? 30 : null;
  return {
    recommendedListingMult: 1.04 + listBump,
    expectedSellingMult: 1.0 + listBump * 0.3,
    quickSaleMult: quickCut,
    expectedDaysToSell: days as number | null,
  };
}

export function applyCategoryStrategy(ctx: StrategyContext): StrategyResult {
  const strategyId = resolveStrategyId(ctx.categorySlug);
  const missingCritical = getMissingCriticalAttributes({
    categorySlug: ctx.categorySlug,
    identity: ctx.identity,
    attributes: ctx.input.attributes,
    conditionGrade: ctx.input.conditionGrade,
    ageMonths: ctx.input.ageMonths ?? ctx.ageMonths,
    city: ctx.input.city,
  });
  const listing = demandListingTweaks(ctx.demandScore, ctx.liquidityScore);
  const notes: string[] = [];

  if (strategyId === "unsupported") {
    return {
      strategyId,
      valueMultiplier: 1,
      listing,
      missingCritical,
      notes: ["Category not supported for automated FairPrice"],
      requiresStrongEvidence: true,
      propertyDisclaimer: false,
    };
  }

  let valueMultiplier = boundedConditionMultiplier(
    ctx.conditionGrade,
    ctx.conditionScore,
  );

  // Age already largely in engine depreciation for MSRP path; keep small extra for comps-only
  if (ctx.ageMonths != null && ctx.ageMonths > 24 && strategyId === "mobile") {
    const extra = Math.min(0.08, (ctx.ageMonths - 24) * 0.002);
    valueMultiplier *= 1 - extra;
    notes.push(`Additional age soft factor for ${ctx.ageMonths} months`);
  }

  if (strategyId === "mobile") {
    const criticalMissing = missingCritical.filter((m) => m.materiality === "critical");
    notes.push("Mobile strategy: storage + battery + condition drive accuracy");
    return {
      strategyId,
      valueMultiplier,
      listing,
      missingCritical,
      notes,
      requiresStrongEvidence: criticalMissing.length >= 3,
      propertyDisclaimer: false,
    };
  }

  if (strategyId === "car" || strategyId === "bike") {
    const criticalMissing = missingCritical.filter((m) => m.materiality === "critical");
    notes.push(
      "Vehicle strategy: year, odometer, and variant are required for precise valuation",
    );
    // Without critical vehicle fields, do not pretend precision
    if (criticalMissing.length >= 2) {
      valueMultiplier = 1; // avoid stacking condition guess on top of incomplete identity
    }
    return {
      strategyId,
      valueMultiplier,
      listing: { ...listing, expectedDaysToSell: listing.expectedDaysToSell ?? 45 },
      missingCritical,
      notes,
      requiresStrongEvidence: criticalMissing.length >= 2,
      propertyDisclaimer: false,
    };
  }

  if (strategyId === "property") {
    notes.push("Property estimate is a market signal — not a professional appraisal");
    return {
      strategyId,
      valueMultiplier: 1,
      listing,
      missingCritical,
      notes,
      requiresStrongEvidence: true,
      propertyDisclaimer: true,
    };
  }

  if (strategyId === "laptop" || strategyId === "tv" || strategyId === "camera" || strategyId === "furniture") {
    notes.push(`${strategyId} category strategy applied`);
    return {
      strategyId,
      valueMultiplier,
      listing,
      missingCritical,
      notes,
      requiresStrongEvidence: missingCritical.filter((m) => m.materiality === "critical").length >= 2,
      propertyDisclaimer: false,
    };
  }

  return {
    strategyId: "generic",
    valueMultiplier,
    listing,
    missingCritical,
    notes: ["Generic valuation strategy"],
    requiresStrongEvidence: false,
    propertyDisclaimer: false,
  };
}
