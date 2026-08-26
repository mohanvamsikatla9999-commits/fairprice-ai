import type { ConditionGrade } from "@prisma/client";
import { conditionGradeToScore, scoreToConditionGrade } from "@/services/valuation/model";
import type { ConditionResult, FairPriceInput } from "./schemas";
import { buildConditionWithProvenance } from "./condition-engine";
import {
  getMissingCriticalAttributes,
  questionsFromMissing,
} from "./attributes";

const UNSUPPORTED_FOR_AUTO = new Set([
  "jobs",
  "services",
  "jobs-data-entry",
  "jobs-other",
  "other-services",
]);

export function isUnsupportedCategory(slug?: string | null): boolean {
  if (!slug) return false;
  if (UNSUPPORTED_FOR_AUTO.has(slug)) return true;
  if (slug.startsWith("jobs-")) return true;
  return false;
}

export function isPropertyCategory(slug?: string | null): boolean {
  if (!slug) return false;
  return (
    slug === "properties" ||
    slug.startsWith("property-") ||
    slug.includes("lands") ||
    slug.includes("pg-")
  );
}

export function buildCondition(
  input: FairPriceInput,
  visionCondition?: string | null,
): ConditionResult {
  const full = buildConditionWithProvenance(input, visionCondition);
  const { evidence: _e, modelVersion: _m, ...rest } = full;
  return {
    ...rest,
    evidence: full.evidence,
  };
}

export function criticalQuestions(
  categorySlug: string | null | undefined,
  unknown: string[] | undefined,
  identity: { brand: string | null; model: string | null; storage?: string | null },
  attributes?: Record<string, string | number | boolean>,
  conditionGrade?: string,
  ageMonths?: number,
  city?: string,
): string[] {
  const missing = getMissingCriticalAttributes({
    categorySlug,
    identity,
    attributes,
    conditionGrade,
    ageMonths,
    city,
  });
  const fromMissing = questionsFromMissing(missing, 4);
  if (fromMissing.length) return fromMissing;

  // Fallback for unknown flags from condition engine
  const qs: string[] = [];
  for (const u of unknown ?? []) {
    if (u === "batteryHealth") qs.push("What is the battery health percentage?");
    if (u === "repairHistory") qs.push("Has this device ever been repaired?");
    if (u === "km_driven") qs.push("How many kilometres has it run?");
    if (u === "year") qs.push("What is the manufacture / registration year?");
  }
  return qs.slice(0, 4);
}

export function demandLabel(score: number): "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
  if (score < 0.2) return "VERY_LOW";
  if (score < 0.4) return "LOW";
  if (score < 0.6) return "MEDIUM";
  if (score < 0.8) return "HIGH";
  return "VERY_HIGH";
}

export function confidenceLabel(
  overall: number,
): "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
  if (overall < 0.25) return "VERY_LOW";
  if (overall < 0.45) return "LOW";
  if (overall < 0.65) return "MEDIUM";
  if (overall < 0.85) return "HIGH";
  return "VERY_HIGH";
}

/**
 * FairPrice Score: attractiveness of asking price vs fair range.
 * Independent of confidence.
 */
export function computeFairPriceScore(
  askingPriceInr: number | undefined,
  fairLow: number,
  fairMid: number,
  fairHigh: number,
): {
  score: number;
  label: string;
  askingPriceInr: number;
  deltaVsMidInr: number;
  relativeBand: "below" | "within" | "above";
} | null {
  if (!askingPriceInr || askingPriceInr <= 0) return null;
  let relativeBand: "below" | "within" | "above" = "within";
  if (askingPriceInr < fairLow) relativeBand = "below";
  else if (askingPriceInr > fairHigh) relativeBand = "above";

  let score: number;
  if (relativeBand === "below") {
    // Attractive for buyers — high score (capped so fire-sale extremes aren't "perfect")
    const under = (fairLow - askingPriceInr) / Math.max(fairMid, 1);
    score = Math.round(Math.max(88, Math.min(98, 96 - under * 20)));
  } else if (relativeBand === "within") {
    const over = Math.max(0, askingPriceInr - fairMid);
    const span = Math.max(fairHigh - fairMid, fairMid * 0.08);
    score = Math.round(Math.max(75, Math.min(100, 100 - (over / span) * 20)));
  } else {
    const over = askingPriceInr - fairHigh;
    const span = Math.max(fairHigh - fairMid, fairMid * 0.15);
    score = Math.round(Math.max(0, Math.min(70, 70 - (over / span) * 55)));
  }

  let label = "Fair ask";
  if (relativeBand === "below") label = "Attractive for buyers";
  else if (score >= 85) label = "Near fair market";
  else if (score >= 65) label = "Slightly above fair";
  else if (score >= 45) label = "Above estimated fair range";
  else label = "Well above estimated fair range";

  return {
    score,
    label,
    askingPriceInr,
    deltaVsMidInr: askingPriceInr - fairMid,
    relativeBand,
  };
}

export function computeConfidence(input: {
  identityConfidence: number;
  conditionConfidence: number;
  comparableCount: number;
  soldCount: number;
  hasNewPriceRef: boolean;
  priceDispersionPct: number;
  attributeUnknownCount: number;
  tierA?: number;
  tierB?: number;
  onlyAskingEvidence?: boolean;
  usedAboveNewAnomaly?: boolean;
  avgFreshness?: number;
}): { overall: number; reasons: string[] } {
  const reasons: string[] = [];
  let overall = 0;

  overall += input.identityConfidence * 0.26;
  reasons.push(`Identity confidence ${(input.identityConfidence * 100).toFixed(0)}%`);

  overall += input.conditionConfidence * 0.1;

  const strongTiers = (input.tierA ?? 0) + (input.tierB ?? 0);
  const compScore = Math.min(1, input.comparableCount / 12);
  const tierBoost = Math.min(0.12, strongTiers * 0.02);
  overall += compScore * 0.26 + tierBoost;
  reasons.push(
    `${input.comparableCount} marketplace comparables` +
      (strongTiers ? ` (${strongTiers} strong tier A/B)` : ""),
  );

  if (input.soldCount > 0) {
    overall += Math.min(0.12, input.soldCount * 0.025);
    reasons.push(`${input.soldCount} sold/transaction signals`);
  } else if (input.onlyAskingEvidence) {
    overall -= 0.06;
    reasons.push("Asking-price evidence only (not transactions)");
  }

  if (input.hasNewPriceRef) {
    overall += 0.1;
    reasons.push("New-price reference available");
  }

  if (input.avgFreshness != null) {
    overall += (input.avgFreshness - 0.5) * 0.08;
  }

  const dispersionPenalty = Math.min(0.15, input.priceDispersionPct / 100);
  overall -= dispersionPenalty;

  overall -= Math.min(0.15, input.attributeUnknownCount * 0.04);

  if (input.usedAboveNewAnomaly) {
    overall -= 0.1;
    reasons.push("Used estimate vs new-price anomaly");
  }

  return {
    overall: Math.max(0, Math.min(1, Math.round(overall * 1000) / 1000)),
    reasons,
  };
}

// Re-export helpers used by older imports
export { getMissingCriticalAttributes } from "./attributes";
export { conditionGradeToScore, scoreToConditionGrade };
export type { ConditionGrade };
