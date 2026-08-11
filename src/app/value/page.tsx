"use client";

import * as React from "react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FairValueCard } from "@/components/valuation/fair-value-card";
import { PriceMeter } from "@/components/valuation/price-meter";
import { ValuationReport } from "@/components/valuation/valuation-report";
import { categories } from "@/config/site";

export default function ValuePage() {
  const [categorySlug, setCategorySlug] = React.useState("mobiles");
  const [productLabel, setProductLabel] = React.useState("");
  const [conditionGrade, setConditionGrade] = React.useState("GOOD");
  const [askingPriceInr, setAskingPriceInr] = React.useState("");
  const [city, setCity] = React.useState("");
  const [ageMonths, setAgeMonths] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [valuation, setValuation] = React.useState<{
    fairValueMinInr: number;
    fairValueMaxInr: number;
    fairValueMidInr: number;
    recommendedListingInr: number;
    expectedSaleMaxInr: number;
    quickSaleInr: number;
    priceConfidence: number;
    marketDemandScore: number;
    conditionScore: number;
    verdict: "UNDERPRICED" | "FAIR" | "SLIGHTLY_HIGH" | "OVERPRICED" | "UNKNOWN";
    negotiationMinInr: number;
    negotiationMaxInr: number;
    explanation?: string;
    buyerVerdict?: string;
    sellerRecommendation?: string;
  } | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const asking = Number(askingPriceInr);
      const age = Number(ageMonths);
      const res = await fetch("/api/ai/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          productLabel: productLabel.trim() || "Item",
          conditionGrade: conditionGrade || "GOOD",
          askingPriceInr:
            Number.isFinite(asking) && asking > 0 ? asking : undefined,
          city: city || undefined,
          ageMonths: Number.isFinite(age) && age >= 0 ? age : undefined,
          persist: false,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Valuation failed");
        return;
      }
      setValuation(json.data.valuation);
    } catch {
      setError("Valuation failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const demand =
    (valuation?.marketDemandScore ?? 0.55) > 0.7
      ? "high"
      : (valuation?.marketDemandScore ?? 0.55) < 0.4
        ? "low"
        : "moderate";

  return (
    <>
      <PageHero
        eyebrow="Valuation"
        title="Know what it's worth"
        description="Run FairPrice AI on any item before you buy or sell."
      />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div>
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Product</Label>
            <Input
              className="mt-1.5"
              value={productLabel}
              onChange={(e) => setProductLabel(e.target.value)}
              placeholder="iPhone 13 128GB"
            />
          </div>
          <div>
            <Label>Condition</Label>
            <Select value={conditionGrade} onValueChange={setConditionGrade}>
              <SelectTrigger className="mt-1.5">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Asking price (optional)</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={askingPriceInr}
                onChange={(e) => setAskingPriceInr(e.target.value)}
              />
            </div>
            <div>
              <Label>Age (months)</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>City</Label>
            <Input
              className="mt-1.5"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <Button variant="lime" className="w-full" disabled={busy} onClick={() => void run()}>
            {busy ? "Running…" : "Check FairPrice"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-4">
          {valuation ? (
            <>
              <FairValueCard
                fairLow={valuation.fairValueMinInr}
                fairHigh={valuation.fairValueMaxInr}
                recommendedListing={valuation.recommendedListingInr}
                expectedSelling={valuation.expectedSaleMaxInr}
                quickSale={valuation.quickSaleInr}
                confidence={Math.round(valuation.priceConfidence * 100)}
                demand={demand}
              />
              {askingPriceInr ? (
                <PriceMeter
                  sellerPrice={Number(askingPriceInr)}
                  fairLow={valuation.fairValueMinInr}
                  fairHigh={valuation.fairValueMaxInr}
                  negotiationLow={valuation.negotiationMinInr}
                  negotiationHigh={valuation.negotiationMaxInr}
                  zone={
                    valuation.verdict === "UNKNOWN" ? undefined : valuation.verdict
                  }
                />
              ) : null}
              <ValuationReport
                productName={productLabel || "Item"}
                sellerPrice={Number(askingPriceInr) || valuation.fairValueMidInr}
                fairLow={valuation.fairValueMinInr}
                fairHigh={valuation.fairValueMaxInr}
                recommendedListing={valuation.recommendedListingInr}
                expectedSelling={valuation.expectedSaleMaxInr}
                quickSale={valuation.quickSaleInr}
                confidence={Math.round(valuation.priceConfidence * 100)}
                demand={demand}
                conditionScore={valuation.conditionScore}
                zone={
                  valuation.verdict === "UNKNOWN" ? undefined : valuation.verdict
                }
                insights={[
                  ...(valuation.explanation
                    ? [{ title: "Explanation", body: valuation.explanation }]
                    : []),
                  ...(valuation.buyerVerdict
                    ? [{ title: "Buyer take", body: valuation.buyerVerdict }]
                    : []),
                  ...(valuation.sellerRecommendation
                    ? [
                        {
                          title: "Seller tip",
                          body: valuation.sellerRecommendation,
                        },
                      ]
                    : []),
                ]}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-background-muted/50 p-10 text-center text-sm text-foreground-muted">
              Enter product details and run Check FairPrice to see the valuation report.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
