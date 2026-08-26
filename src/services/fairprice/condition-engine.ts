import type { ConditionGrade } from "@prisma/client";
import { conditionGradeToScore, scoreToConditionGrade } from "@/services/valuation/model";
import type { ConditionResult, FairPriceInput } from "./schemas";
import { FAIRPRICE_VERSIONS } from "./versions";

export type ConditionEvidenceKind = "OBSERVED" | "USER_PROVIDED" | "INFERRED" | "UNKNOWN";

export type ConditionFactorEvidence = {
  key: string;
  value: string | number | boolean | null;
  kind: ConditionEvidenceKind;
};

/** Bounded condition multipliers — category strategies may override. */
export const CONDITION_BOUNDS: Record<
  string,
  { minPct: number; maxPct: number }
> = {
  NEW: { minPct: 0, maxPct: 0.05 },
  LIKE_NEW: { minPct: 0, maxPct: 0.05 },
  EXCELLENT: { minPct: -0.02, maxPct: 0.03 },
  GOOD: { minPct: -0.05, maxPct: 0 },
  FAIR: { minPct: -0.12, maxPct: -0.05 },
  POOR: { minPct: -0.3, maxPct: -0.1 },
};

export function boundedConditionMultiplier(
  grade: string,
  score: number,
): number {
  const bounds = CONDITION_BOUNDS[grade] ?? CONDITION_BOUNDS.GOOD!;
  // Map score within grade band to [minPct, maxPct]
  const t = Math.max(0, Math.min(1, score / 100));
  const pct = bounds.minPct + (bounds.maxPct - bounds.minPct) * t;
  return 1 + pct;
}

export function buildConditionWithProvenance(
  input: FairPriceInput,
  visionCondition?: string | null,
): ConditionResult & {
  evidence: ConditionFactorEvidence[];
  modelVersion: string;
} {
  const grade = (input.conditionGrade ?? "GOOD") as ConditionGrade | "NEW";
  const score =
    input.conditionScore ??
    (grade === "NEW" ? 100 : conditionGradeToScore(grade as ConditionGrade));

  const evidence: ConditionFactorEvidence[] = [];
  const unknown: string[] = [];
  const factors: string[] = [];
  const observed: Record<string, string> = {};

  if (input.conditionGrade) {
    evidence.push({
      key: "conditionGrade",
      value: input.conditionGrade,
      kind: "USER_PROVIDED",
    });
  } else {
    evidence.push({ key: "conditionGrade", value: "GOOD", kind: "INFERRED" });
    unknown.push("conditionGrade");
  }

  if (visionCondition) {
    evidence.push({
      key: "visibleCondition",
      value: visionCondition,
      kind: "OBSERVED",
    });
    observed.visibleCondition = visionCondition;
    factors.push(`Visible condition cues: ${visionCondition}`);
  }

  const slug = input.categorySlug ?? "";

  if (slug === "mobiles" || slug === "mobile-phones" || slug.includes("mobile")) {
    const battery = input.attributes?.batteryHealth;
    if (battery == null) {
      unknown.push("batteryHealth");
      evidence.push({ key: "batteryHealth", value: null, kind: "UNKNOWN" });
    } else {
      evidence.push({
        key: "batteryHealth",
        value: battery,
        kind: "USER_PROVIDED",
      });
      factors.push(`Battery health: ${battery}`);
    }
    if (input.attributes?.repairHistory == null) {
      unknown.push("repairHistory");
      evidence.push({ key: "repairHistory", value: null, kind: "UNKNOWN" });
    } else {
      evidence.push({
        key: "repairHistory",
        value: String(input.attributes.repairHistory),
        kind: "USER_PROVIDED",
      });
    }
    // Never infer battery from image
    if (visionCondition && battery == null) {
      evidence.push({
        key: "batteryHealthFromImage",
        value: null,
        kind: "UNKNOWN",
      });
    }
  }

  if (slug === "cars" || slug === "bikes" || slug.includes("car") || slug.includes("bike")) {
    if (input.attributes?.km_driven == null && input.attributes?.kmDriven == null) {
      unknown.push("km_driven");
      evidence.push({ key: "odometer", value: null, kind: "UNKNOWN" });
    } else {
      evidence.push({
        key: "odometer",
        value: (input.attributes?.km_driven ?? input.attributes?.kmDriven) as number,
        kind: "USER_PROVIDED",
      });
    }
    if (input.attributes?.year == null && input.ageMonths == null) {
      unknown.push("year");
      evidence.push({ key: "year", value: null, kind: "UNKNOWN" });
    }
  }

  factors.push(`Condition grade: ${grade}`);

  const confidence =
    unknown.length === 0 ? 0.85 : unknown.length === 1 ? 0.7 : 0.55;

  return {
    label: grade === "NEW" ? "NEW" : (scoreToConditionGrade(score) as ConditionResult["label"]),
    score,
    confidence,
    factors,
    observed,
    unknown,
    evidence,
    modelVersion: FAIRPRICE_VERSIONS.conditionModelVersion,
  };
}
