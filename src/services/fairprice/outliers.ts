/**
 * Category-aware robust outlier pipeline.
 * n < 5 → avoid aggressive filtering
 * n 5–10 → conservative
 * n > 10 → robust (MAD / IQR)
 * Never drop a high-value item solely for being expensive when category allows luxury.
 */

export type OutlierMethod = "none" | "iqr" | "mad" | "winsorize";

export type OutlierResult = {
  kept: number[];
  removed: number[];
  method: OutlierMethod;
  bounds: { low: number; high: number } | null;
};

function sortedCopy(values: number[]): number[] {
  return [...values].filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
}

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

function median(sorted: number[]): number {
  return percentile(sorted, 0.5);
}

function mad(sorted: number[]): number {
  const med = median(sorted);
  const deviations = sorted.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  return median(deviations);
}

/** Luxury / high-dispersion categories — widen upper fence. */
function upperFenceMultiplier(categorySlug?: string | null): number {
  const c = (categorySlug ?? "").toLowerCase();
  if (c.includes("car") || c.includes("propert") || c.includes("watch") || c.includes("camera")) {
    return 3.5;
  }
  return 2.5;
}

export function removeRobustOutliers(
  prices: number[],
  opts: { categorySlug?: string | null } = {},
): OutlierResult {
  const clean = sortedCopy(prices);
  if (clean.length < 5) {
    return { kept: [...clean], removed: [], method: "none", bounds: null };
  }

  const med = median(clean);
  const upperMult = upperFenceMultiplier(opts.categorySlug);

  if (clean.length <= 10) {
    // Conservative IQR (1.8× instead of 1.5×)
    const q1 = percentile(clean, 0.25);
    const q3 = percentile(clean, 0.75);
    const iqr = Math.max(q3 - q1, med * 0.05);
    const low = q1 - 1.8 * iqr;
    const high = q3 + upperMult * iqr;
    const kept = clean.filter((p) => p >= low && p <= high);
    if (kept.length < Math.max(3, Math.floor(clean.length * 0.6))) {
      return { kept: [...clean], removed: [], method: "none", bounds: { low, high } };
    }
    return {
      kept,
      removed: clean.filter((p) => p < low || p > high),
      method: "iqr",
      bounds: { low, high },
    };
  }

  // Robust MAD for larger samples
  const m = mad(clean);
  if (m <= 0) {
    const q1 = percentile(clean, 0.25);
    const q3 = percentile(clean, 0.75);
    const iqr = Math.max(q3 - q1, 1);
    const low = q1 - 1.5 * iqr;
    const high = q3 + upperMult * iqr;
    const kept = clean.filter((p) => p >= low && p <= high);
    return {
      kept: kept.length >= 5 ? kept : [...clean],
      removed: kept.length >= 5 ? clean.filter((p) => p < low || p > high) : [],
      method: kept.length >= 5 ? "iqr" : "none",
      bounds: { low, high },
    };
  }

  // Approximate normal: 1.4826 * MAD ≈ σ; use 3.5σ with luxury-aware upper
  const sigma = 1.4826 * m;
  const low = med - 3 * sigma;
  const high = med + (upperMult + 0.5) * sigma;
  const kept = clean.filter((p) => p >= low && p <= high);

  if (kept.length < Math.max(5, Math.floor(clean.length * 0.55))) {
    // Soft winsorize instead of dropping
    const loW = percentile(clean, 0.05);
    const hiW = percentile(clean, 0.95);
    const winsorized = clean.map((p) => Math.min(hiW, Math.max(loW, p)));
    return {
      kept: winsorized,
      removed: [],
      method: "winsorize",
      bounds: { low: loW, high: hiW },
    };
  }

  return {
    kept,
    removed: clean.filter((p) => p < low || p > high),
    method: "mad",
    bounds: { low, high },
  };
}
