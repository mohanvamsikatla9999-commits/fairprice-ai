"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles, TrendingUp, TrendingDown, Minus,
  CheckCircle2, AlertCircle, Tag, Copy, Check,
  MessageSquare, Loader2, ChevronDown, ChevronUp,
  Camera, ImagePlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn, formatInr } from "@/lib/utils";
import type { FairPriceResult } from "@/services/fairprice/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

type GeminiInsight = {
  explanation: string;
  buyerVerdict: string;
  sellerRecommendation: string;
  talkingPoints: string[];
  fairRangeMinInr?: number;
  fairRangeMaxInr?: number;
  recommendedListingInr?: number;
  quickSaleInr?: number;
  depreciation?: number;
  demandLevel?: "LOW" | "MEDIUM" | "HIGH";
  marketTrend?: "RISING" | "STABLE" | "FALLING";
  priceFactors?: Array<{ factor: string; impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; detail: string }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "mobiles",          label: "📱 Mobiles" },
  { value: "laptops",          label: "💻 Laptops" },
  { value: "tvs",              label: "📺 TVs" },
  { value: "tablets",          label: "⬛ Tablets" },
  { value: "cars",             label: "🚗 Cars" },
  { value: "bikes",            label: "🏍️ Bikes" },
  { value: "furniture",        label: "🛋️ Furniture" },
  { value: "electronics",      label: "🔌 Electronics" },
  { value: "appliances",       label: "🧊 Appliances" },
  { value: "cameras",          label: "📷 Cameras" },
  { value: "gaming",           label: "🎮 Gaming" },
  { value: "headphones",       label: "🎧 Headphones" },
];

const CONDITIONS = [
  { value: "LIKE_NEW",  label: "Like New",  desc: "Barely used, no marks" },
  { value: "EXCELLENT", label: "Excellent", desc: "Minor signs of use" },
  { value: "GOOD",      label: "Good",      desc: "Normal wear, works perfectly" },
  { value: "FAIR",      label: "Fair",      desc: "Visible wear, works fine" },
  { value: "POOR",      label: "Poor",      desc: "Heavy wear or minor damage" },
];

const STAGES = [
  { text: "Identifying product…",     pct: 15 },
  { text: "Checking market prices…",  pct: 35 },
  { text: "Analysing comparables…",   pct: 55 },
  { text: "Calling Gemini AI…",        pct: 75 },
  { text: "Preparing your report…",   pct: 90 },
];

// ─── Main page ────────────────────────────────────────────────────────────────

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
  const [stageIdx, setStageIdx] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<FairPriceResult | null>(null);
  const [gemini, setGemini] = React.useState<GeminiInsight | null>(null);

  // Image mode — upload photos to auto-detect product
  const [inputMode, setInputMode] = React.useState<"text" | "image">("text");
  const [uploadedImages, setUploadedImages] = React.useState<Array<{ url: string; storageKey: string }>>([]);
  const [uploadBusy, setUploadBusy] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<Record<string, unknown> | null>(null);

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploadBusy(true);
    setError(null);
    const next = [...uploadedImages];
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const file = files[i]!;
      if (file.size > 8 * 1024 * 1024) { setError("Each image must be under 8MB"); break; }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? "Upload failed"); break; }
      const fd = json.data?.file ?? json.data;
      next.push({ storageKey: fd.storageKey ?? fd.key, url: fd.url });
    }
    setUploadedImages(next.slice(0, 4));
    setUploadBusy(false);
  }

  async function scanImages() {
    if (!uploadedImages.length) return;
    setBusy(true);
    setError(null);
    setScanResult(null);
    setStageIdx(1);
    try {
      const res = await fetch("/api/ai/scan-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploadedImages.map((i) => i.url), categorySlug }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message ?? "Scan failed");
      const product = json.data.product as Record<string, unknown>;
      setScanResult(product);
      // Auto-fill form fields from scan
      if (product.suggestedTitle) setTitle(String(product.suggestedTitle));
      if (product.conditionGrade) setConditionGrade(String(product.conditionGrade));
      if (product.categorySlug) setCategorySlug(String(product.categorySlug));
      if (product.specs && typeof product.specs === "object") {
        const specs = product.specs as Record<string, unknown>;
        if (specs.storage) setStorage(String(specs.storage));
      }
      // Switch to text mode with pre-filled values
      setInputMode("text");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image scan failed");
    } finally {
      setBusy(false);
      setStageIdx(0);
    }
  }

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    setGemini(null);
    setStageIdx(0);

    let idx = 0;
    const timer = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setStageIdx(idx);
    }, 900);

    try {
      // Step 1 — deterministic FairPrice engine
      const fpRes = await fetch("/api/fairprice", {
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
      const fpJson = await fpRes.json();
      if (!fpRes.ok || !fpJson.ok) throw new Error(fpJson.error?.message ?? "Valuation failed");
      const fp = fpJson.data.fairPrice as FairPriceResult;
      setResult(fp);

      // Step 2 — Gemini AI rich explanation
      const gmRes = await fetch("/api/ai/smart-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productLabel: fp.product.productLabel || title,
          categorySlug,
          conditionGrade,
          city: city.trim() || "Hyderabad",
          ageMonths: ageMonths ? Number(ageMonths) : undefined,
          estimatedMrpInr: fp.evidence.newPriceReferenceInr ?? undefined,
          specs: storage ? { storage } : undefined,
          visibleDamage: [],
        }),
      });
      const gmJson = await gmRes.json();
      if (gmJson.ok && gmJson.data?.pricing) {
        const p = gmJson.data.pricing as Record<string, unknown>;
        setGemini({
          explanation:          String(p.explanation ?? ""),
          buyerVerdict:         String(p.buyerVerdict ?? p.explanation ?? ""),
          sellerRecommendation: String(p.sellerRecommendation ?? ""),
          talkingPoints:        Array.isArray(p.sellerTips) ? p.sellerTips as string[] : [],
          fairRangeMinInr:      Number(p.fairRangeMinInr) || undefined,
          fairRangeMaxInr:      Number(p.fairRangeMaxInr) || undefined,
          recommendedListingInr:Number(p.recommendedListingInr) || undefined,
          quickSaleInr:         Number(p.quickSaleInr) || undefined,
          depreciation:         Number(p.depreciation) || undefined,
          demandLevel:          p.demandLevel as GeminiInsight["demandLevel"],
          marketTrend:          p.marketTrend as GeminiInsight["marketTrend"],
          priceFactors:         Array.isArray(p.priceFactors) ? p.priceFactors as GeminiInsight["priceFactors"] : [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Valuation failed");
    } finally {
      clearInterval(timer);
      setStageIdx(STAGES.length - 1);
      setBusy(false);
    }
  }

  const stage = STAGES[stageIdx]!;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white pb-16">
      {/* Hero */}
      <div className="hero-blue">
        <div className="container-page py-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Gemini-powered</p>
              <h1 className="font-display text-3xl font-bold">FairPrice AI</h1>
            </div>
          </div>
          <p className="mt-2 max-w-lg text-white/80">
            Enter any product — Gemini AI explains the original price, depreciation, and what it&apos;s really worth second-hand in India.
          </p>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">

        {/* ── LEFT: Input form ────────────────────────────────────────────── */}
        <form onSubmit={run} className="h-fit space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                inputMode === "text" ? "bg-white shadow-sm" : "text-foreground-muted hover:text-foreground",
              )}
            >
              <Sparkles className="h-4 w-4" /> Type product
            </button>
            <button
              type="button"
              onClick={() => setInputMode("image")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
                inputMode === "image" ? "bg-white shadow-sm" : "text-foreground-muted hover:text-foreground",
              )}
            >
              <Camera className="h-4 w-4" /> Scan photos
            </button>
          </div>

          {/* Image mode */}
          {inputMode === "image" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm font-semibold text-primary">📸 AI Photo Scanner</p>
                <p className="mt-0.5 text-xs text-foreground-muted">Upload up to 4 photos. Gemini identifies the product and fills all details automatically.</p>
              </div>
              <label className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition",
                uploadBusy ? "opacity-50" : "hover:border-primary/50",
                uploadedImages.length ? "border-primary/40 bg-primary/3" : "border-border",
              )}>
                <ImagePlus className="h-8 w-8 text-primary/60" />
                <div>
                  <p className="text-sm font-medium">Click to upload photos</p>
                  <p className="text-xs text-foreground-muted">JPG, PNG, WEBP · up to 4 images · max 8MB each</p>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploadBusy} onChange={(e) => void uploadImages(e.target.files)} />
              </label>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={img.storageKey} className="group relative overflow-hidden rounded-xl border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                      <button type="button" onClick={() => setUploadedImages((p) => p.filter((_, i) => i !== idx))} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {scanResult && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
                  <p className="font-semibold text-green-800">✓ {String(scanResult.productLabel ?? scanResult.brand ?? "Product identified")}</p>
                  <p className="mt-0.5 text-xs text-green-700">Details pre-filled — switch to "Type product" to review &amp; get FairPrice</p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="button" variant="lime" size="lg" className="w-full" disabled={uploadedImages.length === 0 || uploadBusy || busy} onClick={() => void scanImages()}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning with Gemini…</> : <><Camera className="h-4 w-4" /> Scan &amp; identify product</>}
              </Button>
            </div>
          )}

          {/* Text mode */}
          {inputMode === "text" && (<>
          {scanResult && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              AI-filled from your photos — edit any field if needed
            </div>
          )}
          <h2 className="font-display text-lg font-semibold">Product details</h2>
          <div>
            <Label>Category</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Product name *</Label>
            <Input
              id="title"
              className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 15 128GB, POCO M7"
              required
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
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} — {c.desc}
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
                placeholder="128GB, 6GB RAM…"
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
                placeholder="e.g. 18"
                min={0}
              />
            </div>

            <div>
              <Label htmlFor="city">Your city</Label>
              <Input
                id="city"
                className="mt-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Hyderabad"
              />
            </div>

            <div>
              <Label htmlFor="ask">Your asking price (₹)</Label>
              <Input
                id="ask"
                type="number"
                className="mt-2"
                value={askingPriceInr}
                onChange={(e) => setAskingPriceInr(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              className="mt-2 min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any damage, accessories, box, etc."
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {busy && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {stage.text}
              </div>
              <Progress value={stage.pct} className="h-1.5" />
            </div>
          )}

          <Button
            type="submit"
            variant="lime"
            size="lg"
            className="w-full"
            disabled={busy || !title.trim()}
          >
            {busy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Get FairPrice with Gemini</>
            )}
          </Button>
          </>)}
        </form>

        {/* ── RIGHT: Result panel ──────────────────────────────────────────── */}
        <div>
          {!result && !busy ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 font-semibold">Enter a product to get started</p>
              <p className="mt-1 text-sm text-foreground-muted">
                Gemini AI will explain the original price, depreciation, and fair second-hand value with full market context.
              </p>
            </div>
          ) : result ? (
            <FairPriceReport result={result} gemini={gemini} askingPrice={askingPriceInr ? Number(askingPriceInr) : undefined} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── FairPrice report ─────────────────────────────────────────────────────────

function FairPriceReport({
  result,
  gemini,
  askingPrice,
}: {
  result: FairPriceResult;
  gemini: GeminiInsight | null;
  askingPrice?: number;
}) {
  const v = result.valuation;
  const [copied, setCopied] = React.useState(false);
  const [showFactors, setShowFactors] = React.useState(false);

  const isOk = (result.status === "SUCCESS" || result.status === "OK") && v;

  // Use Gemini range if available (often more accurate), else engine range
  const fairLow  = gemini?.fairRangeMinInr  ?? (v ? (v.displayFairLow  ?? v.fairLow)  : null);
  const fairHigh = gemini?.fairRangeMaxInr  ?? (v ? (v.displayFairHigh ?? v.fairHigh) : null);
  const recPrice = gemini?.recommendedListingInr ?? v?.recommendedListingPrice;
  const quickSale= gemini?.quickSaleInr     ?? v?.quickSalePrice;
  const expPrice = v?.expectedSellingPrice;

  function copyResult() {
    if (!fairLow || !fairHigh) return;
    void navigator.clipboard.writeText(
      `FairPrice AI: ${result.product.productLabel}\nFair range: ${formatInr(fairLow)}–${formatInr(fairHigh)}\nRecommended: ${recPrice ? formatInr(recPrice) : "—"}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* ── Main price card ── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Coloured top bar */}
        <div className="hero-blue px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                FairPrice AI · Gemini
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {result.product.productLabel}
              </h2>
              <p className="mt-1 text-sm text-white/75">
                Confidence: {result.confidence.label.replaceAll("_", " ")}
                {result.product.identityConfidence
                  ? ` · Identity ${(result.product.identityConfidence * 100).toFixed(0)}%`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={copyResult}
              className="shrink-0 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
            >
              {copied ? <><Check className="inline h-3 w-3" /> Copied</> : <><Copy className="inline h-3 w-3" /> Copy</>}
            </button>
          </div>

          {isOk && fairLow && fairHigh ? (
            <div className="mt-5">
              <p className="text-sm text-white/70">Fair second-hand range</p>
              <p className="font-display text-4xl font-bold">
                {formatInr(fairLow)} – {formatInr(fairHigh)}
              </p>
              {result.evidence.newPriceReferenceInr ? (
                <p className="mt-1 text-sm text-white/70">
                  Original / MRP ~{formatInr(result.evidence.newPriceReferenceInr)}
                  {gemini?.depreciation ? ` · ~${gemini.depreciation}% depreciation` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-6 space-y-5">
          {/* Price stats */}
          {isOk && (
            <div className="grid grid-cols-3 gap-3">
              <PriceStat label="Recommended" value={recPrice ? formatInr(recPrice) : "—"} highlight />
              <PriceStat label="Expected sell" value={expPrice ? formatInr(expPrice) : "—"} />
              <PriceStat label="Quick sale" value={quickSale ? formatInr(quickSale) : "—"} />
            </div>
          )}

          {/* Asking price verdict */}
          {askingPrice && isOk && fairLow && fairHigh ? (
            <AskingPriceVerdict asking={askingPrice} fairLow={fairLow} fairHigh={fairHigh} />
          ) : null}

          {/* Demand + trend */}
          {gemini?.demandLevel || gemini?.marketTrend ? (
            <div className="flex flex-wrap gap-3">
              {gemini.demandLevel && <DemandBadge level={gemini.demandLevel} />}
              {gemini.marketTrend && <TrendBadge trend={gemini.marketTrend} />}
            </div>
          ) : null}

          {/* Insufficient data message */}
          {!isOk && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">{result.message ?? "Insufficient data for a precise estimate"}</p>
              <ul className="mt-2 space-y-1 pl-4 text-sm text-amber-700 list-disc">
                {result.explanation.map((l) => <li key={l}>{l}</li>)}
              </ul>
              {result.questions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-amber-800">To improve accuracy:</p>
                  <ul className="mt-1 space-y-1 pl-4 text-sm text-amber-700 list-disc">
                    {result.questions.map((q) => <li key={q}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Gemini AI explanation ── */}
      {gemini ? (
        <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display font-semibold">Gemini AI Analysis</h3>
          </div>

          {/* Main explanation */}
          {gemini.explanation && (
            <div className="rounded-xl bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
              {gemini.explanation}
            </div>
          )}

          {/* Buyer & seller cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {gemini.buyerVerdict && (
              <InsightCard
                icon={CheckCircle2}
                title="Buyer take"
                body={gemini.buyerVerdict}
                tone="positive"
              />
            )}
            {gemini.sellerRecommendation && (
              <InsightCard
                icon={Tag}
                title="Seller tip"
                body={gemini.sellerRecommendation}
                tone="tip"
              />
            )}
          </div>

          {/* Negotiation talking points */}
          {gemini.talkingPoints && gemini.talkingPoints.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Negotiation talking points</p>
              </div>
              <ul className="space-y-2">
                {gemini.talkingPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price factors (collapsible) */}
          {gemini.priceFactors && gemini.priceFactors.length > 0 && (
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-semibold"
                onClick={() => setShowFactors((v) => !v)}
              >
                What drives this price
                {showFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showFactors && (
                <div className="mt-3 space-y-2">
                  {gemini.priceFactors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        f.impact === "POSITIVE" ? "bg-green-500" :
                        f.impact === "NEGATIVE" ? "bg-red-400" : "bg-border",
                      )} />
                      <div>
                        <span className="font-medium">{f.factor}</span>
                        <span className="ml-1.5 text-foreground-muted">— {f.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Gemini loading or fallback — show engine explanation
        result.explanation.length > 0 && isOk && (
          <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-semibold text-primary">Fetching Gemini analysis…</p>
            </div>
            <ul className="space-y-1.5 pl-4 text-sm text-foreground-muted list-disc">
              {result.explanation.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        )
      )}

      {/* ── Evidence ── */}
      {isOk && (
        <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">
            Evidence used
          </p>
          <div className="flex flex-wrap gap-2">
            <EvidenceBadge label={`${result.evidence.marketplaceComparables} comparable listings`} />
            {result.evidence.newPriceReferenceInr && (
              <EvidenceBadge label={`New price ref ~${formatInr(result.evidence.newPriceReferenceInr)}`} />
            )}
            {(result.evidence.tierCounts?.A ?? 0) + (result.evidence.tierCounts?.B ?? 0) > 0 && (
              <EvidenceBadge label={`${(result.evidence.tierCounts?.A ?? 0) + (result.evidence.tierCounts?.B ?? 0)} strong tier matches`} />
            )}
          </div>
        </div>
      )}

      {/* ── CTAs ── */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="lime" size="lg">
          <Link href={`/sell${recPrice ? `?price=${recPrice}` : ""}`}>
            <Tag className="h-4 w-4" />
            Sell at this price
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={copyResult}>
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy result</>}
        </Button>
      </div>

      <p className="text-xs text-foreground-muted">
        Estimated FairPrice based on available market evidence and Gemini AI analysis. Not financial advice.
        {" "}Pipeline {result.meta.pipelineVersion} · {result.meta.durationMs}ms
      </p>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PriceStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3 text-center", highlight ? "border-primary/30 bg-primary/5" : "border-border")}>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className={cn("mt-0.5 font-bold", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function AskingPriceVerdict({ asking, fairLow, fairHigh }: { asking: number; fairLow: number; fairHigh: number }) {
  const mid = (fairLow + fairHigh) / 2;
  const ratio = asking / mid;
  let verdict: string;
  let color: string;
  let bg: string;

  if (asking < fairLow * 0.92) {
    verdict = "Your asking price is below fair range — great deal for buyers!";
    color = "text-green-700"; bg = "bg-green-50 border-green-200";
  } else if (asking <= fairHigh) {
    verdict = "Your asking price is within the fair range ✓";
    color = "text-primary"; bg = "bg-primary/5 border-primary/20";
  } else if (ratio <= 1.18) {
    verdict = "Your asking price is slightly above fair range.";
    color = "text-amber-700"; bg = "bg-amber-50 border-amber-200";
  } else {
    verdict = "Your asking price is significantly above fair range.";
    color = "text-red-600"; bg = "bg-red-50 border-red-200";
  }

  return (
    <div className={cn("rounded-xl border p-3 text-sm font-medium", bg, color)}>
      {formatInr(asking)} asking — {verdict}
    </div>
  );
}

function DemandBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const cfg = {
    HIGH:   { label: "High demand", cls: "bg-green-100 text-green-700 border-green-200" },
    MEDIUM: { label: "Medium demand", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    LOW:    { label: "Low demand", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  }[level];
  return <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", cfg.cls)}>{cfg.label}</span>;
}

function TrendBadge({ trend }: { trend: "RISING" | "STABLE" | "FALLING" }) {
  if (trend === "RISING")  return <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"><TrendingUp className="h-3 w-3" /> Market rising</span>;
  if (trend === "FALLING") return <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-600"><TrendingDown className="h-3 w-3" /> Market falling</span>;
  return <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold"><Minus className="h-3 w-3" /> Market stable</span>;
}

function EvidenceBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs">{label}</span>;
}

function InsightCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  tone: "positive" | "tip" | "neutral";
}) {
  const styles = {
    positive: { wrap: "border-green-200 bg-green-50", icon: "bg-green-100 text-green-700" },
    tip:      { wrap: "border-accent/30 bg-accent/10", icon: "bg-accent text-accent-foreground" },
    neutral:  { wrap: "border-primary/15 bg-primary/5", icon: "bg-primary/10 text-primary" },
  }[tone];

  return (
    <div className={cn("rounded-xl border p-4", styles.wrap)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="text-sm leading-relaxed text-foreground-muted">{body}</p>
    </div>
  );
}
