"use client";

import * as React from "react";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatInr } from "@/lib/utils";
import type { FairPriceResult } from "@/services/fairprice/schemas";

const CATEGORIES = [
  "mobiles",
  "cars",
  "bikes",
  "computers-laptops",
  "electronics",
  "furniture",
  "properties",
];

const STAGES = [
  "Identifying product…",
  "Checking market…",
  "Comparing prices…",
  "Analyzing condition…",
  "Calculating FairPrice…",
] as const;

export default function ValuePage() {
  const [categorySlug, setCategorySlug] = React.useState("mobiles");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [conditionGrade, setConditionGrade] = React.useState("GOOD");
  const [askingPriceInr, setAskingPriceInr] = React.useState("");
  const [city, setCity] = React.useState("Hyderabad");
  const [ageMonths, setAgeMonths] = React.useState("");
  const [storage, setStorage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<FairPriceResult | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    let stageIdx = 0;
    setStage(STAGES[0]!);
    const timer = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, STAGES.length - 1);
      setStage(STAGES[stageIdx]!);
    }, 700);

    try {
      const res = await fetch("/api/fairprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          conditionGrade,
          city: city.trim() || undefined,
          askingPriceInr: askingPriceInr ? Number(askingPriceInr) : undefined,
          ageMonths: ageMonths ? Number(ageMonths) : undefined,
          attributes: storage ? { storage } : undefined,
          skipVision: true,
          persist: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error?.message ?? "Valuation failed");
      }
      setResult(json.data.fairPrice as FairPriceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Valuation failed");
    } finally {
      clearInterval(timer);
      setStage(null);
      setBusy(false);
    }
  }

  return (
    <div className="pb-16">
      <PageHero
        title="FairPrice AI"
        description="Evidence-based India resale estimate — not an LLM guessing a number."
      />

      <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form onSubmit={run} className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <div>
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Product title</Label>
            <Input
              id="title"
              className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="iPhone 15 128GB"
              required
            />
          </div>
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              className="mt-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Condition</Label>
              <Select value={conditionGrade} onValueChange={setConditionGrade}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="storage">Storage / variant</Label>
              <Input
                id="storage"
                className="mt-2"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="128GB"
              />
            </div>
            <div>
              <Label htmlFor="ask">Asking price (optional)</Label>
              <Input
                id="ask"
                type="number"
                className="mt-2"
                value={askingPriceInr}
                onChange={(e) => setAskingPriceInr(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="age">Age (months)</Label>
              <Input
                id="age"
                type="number"
                className="mt-2"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                className="mt-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {stage ? <p className="text-sm text-primary">{stage}</p> : null}
          <Button type="submit" disabled={busy || !title.trim()}>
            {busy ? "Analyzing…" : "Get FairPrice"}
          </Button>
        </form>

        <div>
          {!result ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-foreground-muted">
              Enter a product to see estimated FairPrice, confidence, and evidence.
              We never invent Amazon, Flipkart, or marketplace prices.
            </div>
          ) : (
            <FairPricePanel result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

function FairPricePanel({ result }: { result: FairPriceResult }) {
  const v = result.valuation;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          FairPrice AI
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">
          {result.product.productLabel}
        </h2>
        <p className="text-sm text-foreground-muted">
          Identity {(result.product.identityConfidence * 100).toFixed(0)}% ·{" "}
          {result.confidence.label.replaceAll("_", " ")} confidence
        </p>
      </div>

      {(result.status !== "SUCCESS" && result.status !== "OK") || !v ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium">{result.message ?? "Insufficient data"}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-amber-800">
            Status: {result.status.replaceAll("_", " ")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {(result.missingInformation?.length || result.questions.length) ? (
            <div className="mt-3">
              <p className="font-medium">What would help</p>
              <ul className="mt-1 list-disc pl-5">
                {(result.missingInformation?.map((m) => m.question) ?? result.questions).map(
                  (q) => (
                    <li key={q}>{q}</li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div>
            <p className="text-sm text-foreground-muted">Estimated FairPrice</p>
            <p className="font-display text-3xl font-bold">
              {formatInr(v.displayFairLow ?? v.fairLow)} –{" "}
              {formatInr(v.displayFairHigh ?? v.fairHigh)}
            </p>
            <p className="mt-1 text-sm">
              {result.confidence.label.replaceAll("_", " ")} confidence
              {result.fairPriceScore?.askingPriceInr != null
                ? ` · Seller asking ${formatInr(result.fairPriceScore.askingPriceInr)}`
                : ""}
            </p>
          </div>

          {result.fairPriceScore?.score != null ? (
            <div className="rounded-xl bg-background-muted p-4 text-sm">
              <p className="font-medium">
                FairPrice Score {result.fairPriceScore.score}/100
              </p>
              <p className="text-foreground-muted">{result.fairPriceScore.label}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Recommended list" value={formatInr(v.recommendedListingPrice)} />
            <Stat label="Expected selling" value={formatInr(v.expectedSellingPrice)} />
            <Stat label="Quick sale" value={formatInr(v.quickSalePrice)} />
          </div>

          <div>
            <p className="font-medium">Why this estimate?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground-muted">
              {result.explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {result.anomalies?.length ? (
            <div className="rounded-xl border border-border p-3 text-xs text-foreground-muted">
              {result.anomalies.map((a) => (
                <p key={a.code}>{a.message}</p>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>
              Marketplace comps: {result.evidence.marketplaceComparables}
            </Badge>
            {result.evidence.tierCounts ? (
              <Badge>
                Tiers A/B:{" "}
                {(result.evidence.tierCounts.A ?? 0) + (result.evidence.tierCounts.B ?? 0)}
              </Badge>
            ) : null}
            <Badge>
              Amazon:{" "}
              {result.evidence.amazonReferences
                ? `${result.evidence.amazonReferences} ref`
                : "unavailable"}
            </Badge>
            <Badge>
              Flipkart:{" "}
              {result.evidence.flipkartReferences
                ? `${result.evidence.flipkartReferences} ref`
                : "unavailable"}
            </Badge>
            {result.evidence.newPriceReferenceInr ? (
              <Badge>
                New ref ~{formatInr(result.evidence.newPriceReferenceInr)}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link
                href={`/sell?title=${encodeURIComponent(result.product.productLabel)}&price=${v.recommendedListingPrice}`}
              >
                Use recommended price
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `FairPrice for ${result.product.productLabel}: ${formatInr(v.displayFairLow ?? v.fairLow)}–${formatInr(v.displayFairHigh ?? v.fairHigh)}`,
                );
              }}
            >
              Copy result
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-foreground-muted">
        Estimated FairPrice based on available market evidence. Not a guarantee.
        Pipeline {result.meta.pipelineVersion} · {result.meta.durationMs}ms
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background-muted px-3 py-1">
      {children}
    </span>
  );
}
