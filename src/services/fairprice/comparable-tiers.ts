import type { ConditionGrade } from "@prisma/client";
import { freshnessScore01, daysSince } from "./freshness";

/** Evidence price types — never treat as identical. */
export type EvidencePriceType =
  | "TRANSACTION_PRICE"
  | "SOLD_PRICE"
  | "ACCEPTED_OFFER"
  | "OFFER_PRICE"
  | "ASKING_PRICE"
  | "UNKNOWN";

export type ComparableTier = "A" | "B" | "C" | "D";

export const EVIDENCE_TYPE_WEIGHT: Record<EvidencePriceType, number> = {
  TRANSACTION_PRICE: 1.0,
  SOLD_PRICE: 0.95,
  ACCEPTED_OFFER: 0.85,
  OFFER_PRICE: 0.55,
  ASKING_PRICE: 0.45,
  UNKNOWN: 0.35,
};

export type TieredComparable = {
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
  evidenceType: EvidencePriceType;
  tier: ComparableTier;
  identityMatch: number;
  variantMatch: number;
  conditionMatch: number;
  locationMatch: number;
  freshness: number;
  priceReliability: number;
  similarityScore: number;
  comparableWeight: number;
};

export type MatchTarget = {
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  storage?: string | null;
  productLabel?: string | null;
  categorySlug?: string | null;
  conditionGrade?: string | null;
  city?: string | null;
  state?: string | null;
  area?: string | null;
};

function norm(s?: string | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(s: string): string[] {
  return s.split(/\s+/).filter((t) => t.length >= 2);
}

/** Detect Pro / Plus / Max / Ultra family collisions. */
function familyConflict(a: string, b: string): boolean {
  const markers = ["pro", "plus", "max", "ultra", "mini", "air", "se"];
  for (const m of markers) {
    const inA = a.includes(` ${m}`) || a.endsWith(m) || a.includes(`${m} `);
    const inB = b.includes(` ${m}`) || b.endsWith(m) || b.includes(`${m} `);
    if (inA !== inB) return true;
  }
  return false;
}

function storageOf(text: string): string | null {
  const m = text.match(/\b(\d+)\s?(gb|tb)\b/i);
  return m ? `${m[1]}${(m[2] ?? "").toUpperCase()}` : null;
}

export function inferEvidenceType(input: {
  soldAt?: Date | null;
  source?: string | null;
  isSynthetic?: boolean;
  evidenceType?: EvidencePriceType;
}): EvidencePriceType {
  if (input.evidenceType) return input.evidenceType;
  if (input.isSynthetic) return "UNKNOWN";
  if (input.soldAt) return "SOLD_PRICE";
  if ((input.source ?? "").toLowerCase().includes("transaction")) return "TRANSACTION_PRICE";
  if ((input.source ?? "").toLowerCase().includes("offer")) return "OFFER_PRICE";
  if ((input.source ?? "").toLowerCase().includes("marketplace")) return "ASKING_PRICE";
  return "ASKING_PRICE";
}

export function scoreComparable(
  comp: {
    title: string;
    priceInr: number;
    conditionGrade?: ConditionGrade | null;
    city?: string | null;
    state?: string | null;
    soldAt?: Date | null;
    createdAt?: Date | null;
    isSynthetic?: boolean;
    source?: string;
    evidenceType?: EvidencePriceType;
  },
  target: MatchTarget,
): TieredComparable {
  const titleN = norm(comp.title);
  const brandN = norm(target.brand);
  const modelN = norm(target.model);
  const labelN = norm(target.productLabel);
  const storageT = norm(target.storage ?? target.variant);
  const titleStorage = storageOf(titleN);

  let identityMatch = 0.2;
  if (brandN && titleN.includes(brandN)) identityMatch += 0.25;
  if (modelN && titleN.includes(modelN)) identityMatch += 0.35;
  else if (modelN) {
    const modelToks = tokens(modelN);
    const hit = modelToks.filter((t) => titleN.includes(t)).length;
    identityMatch += (hit / Math.max(modelToks.length, 1)) * 0.25;
  }
  if (labelN && tokens(labelN).slice(0, 3).every((t) => titleN.includes(t))) {
    identityMatch = Math.max(identityMatch, 0.85);
  }
  if (familyConflict(norm(modelN || labelN), titleN)) {
    identityMatch = Math.min(identityMatch, 0.25);
  }
  identityMatch = Math.max(0, Math.min(1, identityMatch));

  let variantMatch = 0.5;
  if (storageT) {
    const st = storageT.replace(/\s/g, "");
    const inTitle = titleStorage?.toLowerCase().replace(/\s/g, "") ?? "";
    if (inTitle && inTitle === st) variantMatch = 1;
    else if (titleN.includes(st) || titleN.includes(storageT)) variantMatch = 1;
    else if (inTitle && inTitle !== st) variantMatch = 0.15; // different storage
    else variantMatch = 0.35; // unknown storage in listing
  }

  let conditionMatch = 0.7;
  if (target.conditionGrade && comp.conditionGrade) {
    conditionMatch =
      target.conditionGrade === comp.conditionGrade
        ? 1
        : Math.max(0.4, 1 - 0.15); // soft difference
  }

  let locationMatch = 0.55;
  if (target.city && comp.city && norm(target.city) === norm(comp.city)) {
    locationMatch = 1;
  } else if (target.state && comp.state && norm(target.state) === norm(comp.state)) {
    locationMatch = 0.75;
  }

  const ageDays = daysSince(comp.createdAt ?? comp.soldAt ?? null);
  const freshness = freshnessScore01(ageDays);

  const evidenceType = inferEvidenceType(comp);
  const priceReliability = EVIDENCE_TYPE_WEIGHT[evidenceType];

  // Reject Pro/family mismatches hard
  const hardReject = familyConflict(norm(modelN || labelN), titleN) && identityMatch < 0.5;

  const similarityScore = hardReject
    ? 0.1
    : Math.min(
        1,
        identityMatch * 0.4 +
          variantMatch * 0.3 +
          conditionMatch * 0.1 +
          locationMatch * 0.1 +
          freshness * 0.05 +
          priceReliability * 0.05,
      );

  const tier = assignTier({
    identityMatch,
    variantMatch,
    conditionMatch,
    locationMatch,
    hardReject,
  });

  const comparableWeight = hardReject
    ? 0
    : Math.max(
        0,
        identityMatch *
          variantMatch *
          conditionMatch *
          locationMatch *
          Math.max(0.05, freshness) *
          priceReliability,
      );

  return {
    ...comp,
    evidenceType,
    tier,
    identityMatch,
    variantMatch,
    conditionMatch,
    locationMatch,
    freshness,
    priceReliability,
    similarityScore,
    comparableWeight,
  };
}

function assignTier(s: {
  identityMatch: number;
  variantMatch: number;
  conditionMatch: number;
  locationMatch: number;
  hardReject: boolean;
}): ComparableTier {
  if (s.hardReject) return "D";
  if (s.identityMatch >= 0.85 && s.variantMatch >= 0.9 && s.conditionMatch >= 0.7) {
    if (s.locationMatch >= 0.75) return "A";
    return "B";
  }
  if (s.identityMatch >= 0.7 && s.variantMatch >= 0.75) return "B";
  if (s.identityMatch >= 0.55 && s.variantMatch >= 0.35) return "C";
  return "D";
}

export function summarizeTiers(comps: TieredComparable[]): {
  tierA: number;
  tierB: number;
  tierC: number;
  tierD: number;
  strongCount: number;
  onlyWeak: boolean;
} {
  const tierA = comps.filter((c) => c.tier === "A").length;
  const tierB = comps.filter((c) => c.tier === "B").length;
  const tierC = comps.filter((c) => c.tier === "C").length;
  const tierD = comps.filter((c) => c.tier === "D").length;
  const strongCount = tierA + tierB;
  return {
    tierA,
    tierB,
    tierC,
    tierD,
    strongCount,
    onlyWeak: strongCount === 0 && tierC + tierD > 0,
  };
}

/** Prefer A/B; keep limited C; drop D and hard rejects. */
export function selectComparablePool(
  comps: TieredComparable[],
  limit = 24,
): TieredComparable[] {
  const usable = comps
    .filter((c) => !c.isSynthetic && c.comparableWeight > 0 && c.tier !== "D")
    .sort((a, b) => b.comparableWeight - a.comparableWeight);

  const strong = usable.filter((c) => c.tier === "A" || c.tier === "B");
  if (strong.length >= 3) return strong.slice(0, limit);

  const withC = usable.filter((c) => c.tier === "A" || c.tier === "B" || c.tier === "C");
  return withC.slice(0, limit);
}
