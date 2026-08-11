/**
 * Weighted price distribution utilities for fairLow / fairMid / fairHigh.
 */

export type WeightedPrice = { price: number; weight: number };

function sortedByPrice(items: WeightedPrice[]): WeightedPrice[] {
  return [...items]
    .filter((i) => i.price > 0 && i.weight > 0 && Number.isFinite(i.price))
    .sort((a, b) => a.price - b.price);
}

/** Weighted percentile in [0,1]. */
export function weightedPercentile(items: WeightedPrice[], p: number): number {
  const sorted = sortedByPrice(items);
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0]!.price;

  const total = sorted.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return sorted[Math.floor(sorted.length / 2)]!.price;

  const target = Math.max(0, Math.min(1, p)) * total;
  let cum = 0;
  for (const item of sorted) {
    cum += item.weight;
    if (cum >= target) return item.price;
  }
  return sorted[sorted.length - 1]!.price;
}

export function weightedMedian(items: WeightedPrice[]): number {
  return weightedPercentile(items, 0.5);
}

export type DistributionStats = {
  sampleSize: number;
  weightedMedian: number;
  weightedP25: number;
  weightedP75: number;
  dispersionPct: number;
  totalWeight: number;
};

export function computeDistribution(items: WeightedPrice[]): DistributionStats {
  const sorted = sortedByPrice(items);
  const sampleSize = sorted.length;
  if (!sampleSize) {
    return {
      sampleSize: 0,
      weightedMedian: 0,
      weightedP25: 0,
      weightedP75: 0,
      dispersionPct: 100,
      totalWeight: 0,
    };
  }
  const med = weightedMedian(sorted);
  const p25 = weightedPercentile(sorted, 0.25);
  const p75 = weightedPercentile(sorted, 0.75);
  const totalWeight = sorted.reduce((s, i) => s + i.weight, 0);
  const dispersionPct =
    med > 0 ? Math.max(0, ((p75 - p25) / med) * 100) : 100;

  return {
    sampleSize,
    weightedMedian: Math.round(med),
    weightedP25: Math.round(p25),
    weightedP75: Math.round(p75),
    dispersionPct,
    totalWeight,
  };
}

/**
 * Fair range width scales with dispersion and sample size.
 * More uncertainty → wider range.
 */
export function fairRangeFromDistribution(
  mid: number,
  dist: DistributionStats,
): { fairLow: number; fairMid: number; fairHigh: number } {
  const fairMid = Math.max(1, Math.round(mid));
  if (dist.sampleSize >= 3 && dist.weightedP25 > 0 && dist.weightedP75 > 0) {
    // Blend statistical percentiles with mid-centered uncertainty band
    const sampleUncertainty =
      dist.sampleSize < 5 ? 0.08 : dist.sampleSize < 10 ? 0.05 : 0.03;
    const dispBand = Math.max(
      (dist.weightedP75 - dist.weightedP25) * 0.5,
      fairMid * (0.04 + sampleUncertainty + Math.min(0.12, dist.dispersionPct / 400)),
    );
    let fairLow = Math.round(Math.min(dist.weightedP25, fairMid - dispBand * 0.55));
    let fairHigh = Math.round(Math.max(dist.weightedP75, fairMid + dispBand * 0.5));
    fairLow = Math.max(1, Math.min(fairLow, fairMid));
    fairHigh = Math.max(fairMid, fairHigh);
    return { fairLow, fairMid, fairHigh };
  }

  const width = fairMid * (0.08 + Math.min(0.15, dist.dispersionPct / 200));
  return {
    fairLow: Math.max(1, Math.round(fairMid - width)),
    fairMid,
    fairHigh: Math.round(fairMid + width * 0.9),
  };
}
