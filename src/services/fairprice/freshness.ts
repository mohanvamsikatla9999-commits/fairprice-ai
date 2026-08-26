/**
 * Listing / evidence freshness decay.
 * Prevents 2-year-old listings from dominating today's FairPrice.
 */

export function daysSince(date?: Date | string | null): number {
  if (!date) return 999;
  const t = typeof date === "string" ? Date.parse(date) : date.getTime();
  if (!Number.isFinite(t)) return 999;
  return Math.max(0, (Date.now() - t) / 86_400_000);
}

export function freshnessLabelFromHours(hours: number): "fresh" | "recent" | "stale" | "old" {
  if (hours < 6) return "fresh";
  if (hours < 24) return "recent";
  if (hours < 72) return "stale";
  return "old";
}

/**
 * Exponential-ish decay for marketplace comps.
 * Half-life ≈ 45 days; near-zero after ~180 days.
 */
export function freshnessWeight(ageDays: number): number {
  const d = Math.max(0, ageDays);
  if (d <= 7) return 1;
  if (d <= 30) return 0.9;
  if (d <= 60) return 0.7;
  if (d <= 90) return 0.45;
  if (d <= 180) return 0.2;
  return 0.05;
}

export function freshnessScore01(ageDays: number): number {
  return Math.max(0, Math.min(1, freshnessWeight(ageDays)));
}
