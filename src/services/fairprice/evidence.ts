import type { ComparableInput } from "@/services/valuation/model";
import type { ComparableEvidence } from "./schemas";
import {
  inferEvidenceType,
  scoreComparable,
  type MatchTarget,
} from "./comparable-tiers";
import { daysSince, freshnessScore01 } from "./freshness";

export function toComparableEvidence(
  comps: ComparableInput[],
  opts: {
    city?: string;
    conditionGrade?: string;
    brand?: string;
    model?: string;
    storage?: string;
    productLabel?: string;
    categorySlug?: string;
  } = {},
): ComparableEvidence[] {
  const target: MatchTarget = {
    brand: opts.brand,
    model: opts.model,
    storage: opts.storage,
    variant: opts.storage,
    productLabel: opts.productLabel,
    categorySlug: opts.categorySlug,
    conditionGrade: opts.conditionGrade,
    city: opts.city,
  };

  return comps.map((c) => {
    const tiered = scoreComparable(
      {
        ...c,
        evidenceType: c.evidenceType ?? inferEvidenceType(c),
      },
      target,
    );
    const ageDays = daysSince(c.createdAt ?? c.soldAt ?? null);
    const evidenceType = tiered.evidenceType;
    const soldStatus =
      evidenceType === "SOLD_PRICE" || evidenceType === "TRANSACTION_PRICE"
        ? "sold"
        : c.isSynthetic
          ? "unknown"
          : "asking";

    return {
      listingId: c.id,
      title: c.title,
      priceInr: c.priceInr,
      condition: c.conditionGrade ?? null,
      location: [c.city, c.state].filter(Boolean).join(", ") || null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      soldStatus,
      evidenceType,
      tier: tiered.tier,
      similarityScore: tiered.similarityScore,
      freshnessScore: freshnessScore01(ageDays),
      isSynthetic: c.isSynthetic,
    };
  });
}

/** Weighted new-price reference — never blind average of unavailable sources. */
export function weightedNewPriceReference(
  refs: Array<{
    priceInr: number | null;
    matchScore: number;
    available: boolean;
    freshness: string;
  }>,
): number | null {
  const usable = refs.filter(
    (r) => r.available && r.priceInr != null && r.priceInr > 0 && r.matchScore >= 0.7,
  );
  if (!usable.length) return null;

  const freshnessW: Record<string, number> = {
    fresh: 1,
    recent: 0.85,
    stale: 0.55,
    old: 0.3,
  };

  let num = 0;
  let den = 0;
  for (const r of usable) {
    const w = r.matchScore * (freshnessW[r.freshness] ?? 0.5);
    num += r.priceInr! * w;
    den += w;
  }
  if (den <= 0) return null;
  return Math.round(num / den);
}

/**
 * Strict external product match — brand/model/variant, not title alone.
 */
export function externalMatchScore(input: {
  queryBrand?: string | null;
  queryModel?: string | null;
  queryStorage?: string | null;
  resultTitle: string;
  resultBrand?: string | null;
  resultModel?: string | null;
}): number {
  const qb = (input.queryBrand ?? "").toLowerCase();
  const qm = (input.queryModel ?? "").toLowerCase();
  const qs = (input.queryStorage ?? "").toLowerCase().replace(/\s/g, "");
  const title = input.resultTitle.toLowerCase();
  const rb = (input.resultBrand ?? "").toLowerCase();
  const rm = (input.resultModel ?? "").toLowerCase();

  if (!qb && !qm) return 0;
  let score = 0;
  if (qb && (rb === qb || title.includes(qb))) score += 0.35;
  else return 0;
  if (qm && (rm.includes(qm) || title.includes(qm))) score += 0.4;
  else return 0;
  if (qs) {
    if (title.replace(/\s/g, "").includes(qs)) score += 0.25;
    else score *= 0.5; // uncertain variant
  } else {
    score += 0.1;
  }
  return Math.min(1, score);
}
