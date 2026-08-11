import type { ConditionGrade, PriceVerdict } from "@prisma/client";

export const ENGINE_VERSION = "v1.2";

export type ValuationAttributes = {
  categorySlug?: string;
  brand?: string;
  model?: string;
  productLabel?: string;
  conditionGrade: ConditionGrade;
  conditionScore?: number;
  ageMonths?: number;
  city?: string;
  state?: string;
  area?: string;
  askingPriceInr?: number;
  msrpInr?: number;
  attributes?: Record<string, string | number | boolean>;
  demandScore?: number;
  liquidityScore?: number;
  /** When false, fetchComparables must not invent synthetic comps. Default true for legacy. */
  allowSyntheticComps?: boolean;
  storage?: string;
  variant?: string;
};

export type EvidencePriceType =
  | "TRANSACTION_PRICE"
  | "SOLD_PRICE"
  | "ACCEPTED_OFFER"
  | "OFFER_PRICE"
  | "ASKING_PRICE"
  | "UNKNOWN";

export type ComparableInput = {
  id?: string;
  title: string;
  priceInr: number;
  conditionGrade?: ConditionGrade | null;
  city?: string | null;
  state?: string | null;
  ageMonths?: number | null;
  soldAt?: Date | null;
  createdAt?: Date | null;
  isSynthetic?: boolean;
  source?: string;
  evidenceType?: EvidencePriceType;
  tier?: "A" | "B" | "C" | "D";
  similarityScore?: number;
  weight?: number;
};

export type ValuationFactor = {
  name: string;
  impactInr: number;
  impactPct: number;
  description: string;
};

export type ValuationResult = {
  engineVersion: string;
  productLabel: string;
  fairValueMinInr: number;
  fairValueMaxInr: number;
  fairValueMidInr: number;
  recommendedListingInr: number;
  expectedSaleMinInr: number;
  expectedSaleMaxInr: number;
  quickSaleInr: number;
  conditionScore: number;
  priceConfidence: number;
  marketDemandScore: number;
  marketLiquidity: number;
  depreciationEstimate: number;
  marketTrend: "up" | "down" | "stable";
  verdict: PriceVerdict;
  negotiationMinInr: number;
  negotiationMaxInr: number;
  comparableCount: number;
  factors: ValuationFactor[];
  compsUsed: ComparableInput[];
  baseMedianInr: number;
  p25Inr: number;
  p75Inr: number;
  explanation?: string;
  buyerVerdict?: string;
  sellerRecommendation?: string;
  /** Transparent calculation trail for FairPrice auditability. */
  calculationTrace?: {
    msrpAnchorInr: number | null;
    compsMedianInr: number | null;
    blendedBaseInr: number;
    locationMult: number;
    demandMult: number;
    liquidityMult: number;
    conditionMult: number;
    softAppliedToValue: boolean;
    demandAppliedToValue: boolean;
    outlierMethod: string | null;
    realComparableCount: number;
    syntheticComparableCount: number;
    usedAboveNewFlag: boolean;
  };
};

export function conditionGradeToScore(grade: ConditionGrade): number {
  switch (grade) {
    case "LIKE_NEW":
      return 95;
    case "EXCELLENT":
      return 85;
    case "GOOD":
      return 70;
    case "FAIR":
      return 55;
    case "POOR":
      return 35;
    default:
      return 70;
  }
}

export function scoreToConditionGrade(score: number): ConditionGrade {
  if (score >= 90) return "LIKE_NEW";
  if (score >= 80) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 45) return "FAIR";
  return "POOR";
}

export function computePriceVerdict(
  askingPriceInr: number | undefined,
  fairMid: number,
  fairMin: number,
  fairMax: number,
): PriceVerdict {
  if (askingPriceInr === undefined || askingPriceInr <= 0 || fairMid <= 0) {
    return "UNKNOWN";
  }
  const ratio = askingPriceInr / fairMid;
  if (askingPriceInr < fairMin * 0.92 || ratio <= 0.88) return "UNDERPRICED";
  if (askingPriceInr <= fairMax && ratio <= 1.08) return "FAIR";
  if (ratio <= 1.18) return "SLIGHTLY_HIGH";
  return "OVERPRICED";
}

export function verdictLabel(verdict: PriceVerdict): string {
  switch (verdict) {
    case "UNDERPRICED":
      return "Underpriced";
    case "FAIR":
      return "Fair price";
    case "SLIGHTLY_HIGH":
      return "Slightly high";
    case "OVERPRICED":
      return "Overpriced";
    default:
      return "Unknown";
  }
}
