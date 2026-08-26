"use client";

import * as React from "react";
import { formatInr } from "@/lib/utils";
import type { FairPriceResult } from "@/services/fairprice/schemas";
import { Button } from "@/components/ui/button";

type Props = {
  listingId: string;
  title: string;
  categorySlug?: string;
  askingPriceInr: number;
  city?: string | null;
  conditionGrade?: string;
};

/**
 * Listing-page FairPrice panel. Hidden when confidence too low / insufficient data.
 */
export function ListingFairPricePanel({
  listingId,
  title,
  categorySlug,
  askingPriceInr,
  city,
  conditionGrade,
}: Props) {
  const [result, setResult] = React.useState<FairPriceResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/fairprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          title,
          categorySlug,
          askingPriceInr,
          city: city ?? undefined,
          conditionGrade,
          skipVision: true,
          persist: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message ?? "FairPrice unavailable");
      }
      setResult(json.data.fairPrice as FairPriceResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "FairPrice unavailable");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  if (busy && !result) {
    return (
      <div className="rounded-2xl border border-border p-4 text-sm text-foreground-muted">
        Calculating FairPrice…
      </div>
    );
  }

  if (error || !result) return null;
  if (
    (result.status !== "SUCCESS" && result.status !== "OK") ||
    !result.valuation
  ) {
    return null;
  }
  if (result.confidence.overall < 0.35) return null;

  const v = result.valuation;
  const score = result.fairPriceScore;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        FairPrice AI
      </p>
      <p className="mt-2 font-display text-2xl font-bold">
        {formatInr(v.displayFairLow ?? v.fairLow)} –{" "}
        {formatInr(v.displayFairHigh ?? v.fairHigh)}
      </p>
      <p className="mt-1 text-sm text-foreground-muted">
        Seller asks {formatInr(askingPriceInr)} · Confidence{" "}
        {result.confidence.label.replaceAll("_", " ")}
      </p>
      {score?.score != null ? (
        <p className="mt-2 text-sm">
          FairPrice Score <strong>{score.score}/100</strong> — {score.label}
        </p>
      ) : null}
      {score?.relativeBand === "above" && score.deltaVsMidInr != null ? (
        <p className="mt-1 text-sm text-foreground-muted">
          About {formatInr(Math.max(0, askingPriceInr - (v.displayFairHigh ?? v.fairHigh)))}–
          {formatInr(Math.max(0, askingPriceInr - (v.displayFairLow ?? v.fairLow)))} above
          estimated fair range
        </p>
      ) : null}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground-muted">
        {result.explanation.slice(0, 3).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-foreground-muted">
        Based on {result.evidence.marketplaceComparables} similar listings
        {result.evidence.newPriceReferenceInr
          ? ` · new ref ~${formatInr(result.evidence.newPriceReferenceInr)}`
          : ""}
        {city ? ` · ${city}` : ""}. Estimated — not a guarantee.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => void load()}
      >
        Refresh
      </Button>
    </div>
  );
}
