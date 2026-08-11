"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/config/site";
import { formatInr } from "@/lib/utils";
import { MOBILE_SELL_ATTRIBUTE_DEFS } from "@/services/valuation/mobile-attributes";

const STEPS = [
  "Category",
  "Product",
  "Details",
  "Condition",
  "Photos",
  "Location",
  "Pricing",
  "Review",
] as const;

type CatalogItem = {
  brand: string;
  model: string;
  label: string;
  slug: string;
  msrpInr: number;
  categorySlug: string;
};

type MobileForm = {
  storage: string;
  ram: string;
  color: string;
  network: string;
  ageMonths: string;
  batteryHealth: string;
  screenCondition: string;
  bodyCondition: string;
  boxAvailable: boolean;
  chargerAvailable: boolean;
  earphonesAvailable: boolean;
  invoiceAvailable: boolean;
  warranty: string;
  warrantyMonthsLeft: string;
  repairHistory: string;
  imeiVerified: boolean;
  purchasedFrom: string;
};

const defaultMobileForm: MobileForm = {
  storage: "128GB",
  ram: "6GB",
  color: "",
  network: "5G",
  ageMonths: "3",
  batteryHealth: "90",
  screenCondition: "Perfect",
  bodyCondition: "Perfect",
  boxAvailable: true,
  chargerAvailable: true,
  earphonesAvailable: false,
  invoiceAvailable: true,
  warranty: "Manufacturer warranty left",
  warrantyMonthsLeft: "6",
  repairHistory: "Never repaired",
  imeiVerified: false,
  purchasedFrom: "Amazon / Flipkart",
};

export default function SellPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"quick" | "full">("quick");
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [categorySlug, setCategorySlug] = React.useState("mobiles");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [conditionGrade, setConditionGrade] = React.useState("GOOD");
  const [priceInr, setPriceInr] = React.useState("");
  const [originalPriceInr, setOriginalPriceInr] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [images, setImages] = React.useState<
    Array<{ storageKey: string; url: string; mimeType?: string; sizeBytes?: number }>
  >([]);
  const [valuationHint, setValuationHint] = React.useState<string | null>(null);
  const [valuationFactors, setValuationFactors] = React.useState<
    Array<{ name: string; description: string; impactInr?: number }>
  >([]);
  const [listingId, setListingId] = React.useState<string | null>(null);
  const [catalog, setCatalog] = React.useState<CatalogItem[]>([]);
  const [brands, setBrands] = React.useState<string[]>([]);
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [catalogQuery, setCatalogQuery] = React.useState("");
  const [identifiedNote, setIdentifiedNote] = React.useState<string | null>(null);
  const [mobile, setMobile] = React.useState<MobileForm>(defaultMobileForm);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (!json.ok) router.push("/login?next=/sell");
    })();
  }, [router]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        const params = new URLSearchParams({
          category: categorySlug,
          q: catalogQuery,
        });
        if (brandFilter !== "all") params.set("brand", brandFilter);
        const res = await fetch(`/api/products/catalog?${params}`);
        const json = await res.json();
        if (json.ok) {
          setCatalog(json.data.products as CatalogItem[]);
          if (json.data.brands) setBrands(json.data.brands as string[]);
        }
      })();
    }, 200);
    return () => clearTimeout(t);
  }, [categorySlug, catalogQuery, brandFilter]);

  function applyProduct(p: CatalogItem) {
    setTitle(p.label);
    setCatalogQuery(p.label);
    setBrandFilter(p.brand);
    setOriginalPriceInr(String(p.msrpInr));
    setIdentifiedNote(
      `Selected ${p.label}. Catalog MRP ${formatInr(p.msrpInr)}. Fill box/charger/warranty details for an accurate FairPrice.`,
    );
  }

  function mobileAttributesPayload() {
    const age = Number(mobile.ageMonths);
    const battery = Number(mobile.batteryHealth);
    const warrantyMonths = Number(mobile.warrantyMonthsLeft);
    return {
      storage: mobile.storage,
      ram: mobile.ram,
      color: mobile.color || undefined,
      network: mobile.network || undefined,
      ageMonths: Number.isFinite(age) ? age : undefined,
      batteryHealth: Number.isFinite(battery) ? battery : undefined,
      screenCondition: mobile.screenCondition,
      bodyCondition: mobile.bodyCondition,
      boxAvailable: mobile.boxAvailable,
      chargerAvailable: mobile.chargerAvailable,
      earphonesAvailable: mobile.earphonesAvailable,
      invoiceAvailable: mobile.invoiceAvailable,
      warranty: mobile.warranty,
      warrantyMonthsLeft: Number.isFinite(warrantyMonths) ? warrantyMonths : undefined,
      repairHistory: mobile.repairHistory,
      imeiVerified: mobile.imeiVerified,
      purchasedFrom: mobile.purchasedFrom || undefined,
    };
  }

  async function identifyFromPhotos(nextImages = images) {
    if (!nextImages.length && !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hint: title || catalogQuery || undefined,
          categorySlug,
          imageUrls: nextImages.map((i) => i.url).slice(0, 3),
        }),
      });
      const json = await res.json();
      if (!json.ok || !json.data.identified || !json.data.product) {
        setIdentifiedNote(
          json.data?.message ??
            "Could not identify from photos — search POCO M7 (or your model) in the catalog.",
        );
        return;
      }
      const p = json.data.product;
      setTitle(p.productLabel);
      setCatalogQuery(p.productLabel);
      if (p.brand) setBrandFilter(p.brand);
      if (p.msrpInr) setOriginalPriceInr(String(p.msrpInr));
      if (p.categorySlug) setCategorySlug(p.categorySlug);
      if (p.storage) setMobile((m) => ({ ...m, storage: p.storage }));
      setIdentifiedNote(
        `${p.notes ?? `Identified as ${p.productLabel}.`} Confidence ${Math.round((p.confidence ?? 0) * 100)}%.`,
      );
    } catch {
      setIdentifiedNote("Identification unavailable. Select your model from the catalog.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const uploaded: typeof images = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json.ok) uploaded.push(json.data.file);
    }
    const next = [...images, ...uploaded];
    setImages(next);
    setBusy(false);
    await identifyFromPhotos(next);
  }

  async function runPricingHint() {
    setBusy(true);
    setError(null);
    setValuationHint(null);
    setValuationFactors([]);
    try {
      const asking = Number(priceInr);
      const msrp = Number(originalPriceInr);
      if (!title.trim()) {
        setError("Select your exact phone from the catalog (e.g. POCO M7).");
        return;
      }
      if (!Number.isFinite(msrp) || msrp <= 0) {
        setError("Enter original / MRP so FairPrice can cap used value correctly.");
        return;
      }
      const attributes = mobileAttributesPayload();
      const res = await fetch("/api/ai/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug,
          productLabel: title.trim(),
          conditionGrade: conditionGrade || "GOOD",
          askingPriceInr: Number.isFinite(asking) && asking > 0 ? asking : undefined,
          msrpInr: msrp,
          ageMonths: attributes.ageMonths,
          city: city || undefined,
          state: state || undefined,
          attributes,
          persist: false,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Could not get FairPrice suggestion");
        return;
      }
      const v = json.data.valuation;
      setValuationHint(
        [
          `${v.productLabel}`,
          `Fair ${formatInr(v.fairValueMinInr)}–${formatInr(v.fairValueMaxInr)}`,
          `List around ${formatInr(v.recommendedListingInr)}`,
          `Quick sale ${formatInr(v.quickSaleInr)}`,
          `Your ask ${asking ? formatInr(asking) : "—"} → ${String(v.verdict).replaceAll("_", " ")}`,
        ].join(" · "),
      );
      setValuationFactors(
        (v.factors ?? []).slice(0, 8).map((f: { name: string; description?: string; impactInr?: number }) => ({
          name: f.name,
          description: f.description ?? "",
          impactInr: f.impactInr,
        })),
      );
      if (!priceInr) setPriceInr(String(v.recommendedListingInr));
    } catch {
      setError("Could not get FairPrice suggestion. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveCategoryId(slug: string): Promise<string> {
    const r2 = await fetch("/api/listings/resolve-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const j = await r2.json();
    if (j.ok) return j.data.id as string;
    throw new Error(j.error?.message ?? "Category not found");
  }

  async function saveDraft(publish = false) {
    setBusy(true);
    setError(null);
    try {
      const resolvedCategoryId = await resolveCategoryId(categorySlug);
      const attributes = Object.entries(mobileAttributesPayload())
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([key, value]) => ({
          key,
          value: typeof value === "boolean" ? (value ? "true" : "false") : String(value),
        }));

      const catRes = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: resolvedCategoryId,
          title: title || "Untitled listing",
          description: description || "Listed on FairPrice AI",
          priceInr: Number(priceInr) || 1000,
          originalPriceInr: originalPriceInr ? Number(originalPriceInr) : undefined,
          conditionGrade,
          city: city || undefined,
          state: state || undefined,
          images,
          attributes: [
            ...attributes,
            { key: "categorySlug", value: categorySlug },
            { key: "wizard", value: "v3-mobile" },
            { key: "productLabel", value: title },
          ],
        }),
      });
      const json = await catRes.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Could not create listing");
        return;
      }
      const id = json.data.listing.id as string;
      setListingId(id);
      if (publish) {
        const pub = await fetch(`/api/listings/${id}/publish`, { method: "POST" });
        const pubJson = await pub.json();
        if (!pubJson.ok) {
          setError(pubJson.error?.message ?? "Publish failed");
          return;
        }
        router.push(`/product/${id}`);
        return;
      }
      setStep(STEPS.length - 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create listing");
    } finally {
      setBusy(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const isMobile = categorySlug === "mobiles";

  return (
    <>
      <PageHero
        eyebrow="Sell"
        title="List with FairPrice AI"
        description="Photo-first listing with FairPrice suggestion — post in minutes, or use full details for mobiles."
      />
      <div className="container-page max-w-3xl py-10">
        <div className="mb-6 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "quick" ? "lime" : "outline"}
            onClick={() => {
              setMode("quick");
              setStep(4);
            }}
          >
            Quick sell
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "full" ? "lime" : "outline"}
            onClick={() => {
              setMode("full");
              setStep(0);
            }}
          >
            Full listing
          </Button>
        </div>

        {mode === "quick" ? (
          <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div>
              <Label>Photos first</Label>
              <p className="mt-1 text-sm text-foreground-muted">
                Upload clear photos — FairPrice AI will try to identify the item.
              </p>
              <Input
                className="mt-2"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void uploadFiles(e.target.files)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.storageKey}
                    src={img.url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
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
              <Label>Title</Label>
              <Input
                className="mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. POCO M7 5G 128GB"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  className="mt-1.5"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hyderabad"
                />
              </div>
              <div>
                <Label>Your price (₹)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                />
              </div>
            </div>
            {valuationHint ? (
              <p className="rounded-xl bg-secondary px-4 py-3 text-sm">{valuationHint}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy || !title}
                onClick={() => void runPricingHint()}
              >
                Get FairPrice
              </Button>
              <Button
                type="button"
                variant="lime"
                disabled={busy || !title || !priceInr}
                onClick={() => void saveDraft(true)}
              >
                {busy ? "Publishing…" : "Publish listing"}
              </Button>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {mode === "full" ? (
          <>
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">{STEPS[step]}</span>
            <span className="text-foreground-muted">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <Label>Category</Label>
              <Select value={categorySlug} onValueChange={setCategorySlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
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
          )}

          {step === 1 && (
            <div className="space-y-4">
              {isMobile ? (
                <>
                  <div>
                    <Label>Brand</Label>
                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All brands</SelectItem>
                        {brands.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-search">Search model</Label>
                    <Input
                      id="product-search"
                      value={catalogQuery}
                      onChange={(e) => {
                        setCatalogQuery(e.target.value);
                        setTitle(e.target.value);
                      }}
                      placeholder="e.g. POCO M7"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="max-h-64 overflow-auto rounded-xl border border-border">
                    {catalog.length === 0 ? (
                      <p className="p-3 text-sm text-foreground-muted">No matches. Try another model name.</p>
                    ) : (
                      catalog.map((p) => (
                        <button
                          key={p.slug}
                          type="button"
                          className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-left text-sm last:border-0 hover:bg-secondary"
                          onClick={() => applyProduct(p)}
                        >
                          <span>
                            <span className="font-medium">{p.label}</span>
                            <span className="ml-2 text-xs text-foreground-muted">{p.brand}</span>
                          </span>
                          <span className="text-foreground-muted">MRP {formatInr(p.msrpInr)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5"
                    placeholder="Product title"
                  />
                </div>
              )}
              <div>
                <Label>Listing title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5"
                  placeholder="POCO M7 128GB"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1.5"
                  placeholder="Mention bill, box, scratches, and reason for selling."
                />
              </div>
              {identifiedNote ? (
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm">{identifiedNote}</p>
              ) : null}
            </div>
          )}

          {step === 2 && isMobile && (
            <div className="grid gap-4 sm:grid-cols-2">
              {MOBILE_SELL_ATTRIBUTE_DEFS.filter((d) =>
                ["storage", "ram", "color", "network", "ageMonths", "purchasedFrom"].includes(d.key),
              ).map((def) => (
                <div key={def.key} className={def.type === "TEXT" ? "sm:col-span-2" : ""}>
                  <Label>{def.label}</Label>
                  {def.type === "SELECT" && "options" in def && def.options ? (
                    <Select
                      value={String(mobile[def.key as keyof MobileForm] ?? "")}
                      onValueChange={(v) => setMobile((m) => ({ ...m, [def.key]: v }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {def.options.map((o: string) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={def.type === "NUMBER" ? "number" : "text"}
                      className="mt-1.5"
                      value={String(mobile[def.key as keyof MobileForm] ?? "")}
                      onChange={(e) =>
                        setMobile((m) => ({ ...m, [def.key]: e.target.value }))
                      }
                    />
                  )}
                  {"helpText" in def && def.helpText ? (
                    <p className="mt-1 text-xs text-foreground-muted">{def.helpText}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {step === 2 && !isMobile && (
            <p className="text-sm text-foreground-muted">
              Extra specs for this category can be added in the description for now.
            </p>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label>Overall condition grade</Label>
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

              {isMobile ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["screenCondition", "bodyCondition", "repairHistory", "warranty"] as const).map(
                      (key) => {
                        const def = MOBILE_SELL_ATTRIBUTE_DEFS.find((d) => d.key === key)!;
                        const options =
                          "options" in def && Array.isArray(def.options)
                            ? ([...def.options] as string[])
                            : [];
                        return (
                          <div key={key}>
                            <Label>{def.label}</Label>
                            <Select
                              value={String(mobile[key])}
                              onValueChange={(v) => setMobile((m) => ({ ...m, [key]: v }))}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      },
                    )}
                    <div>
                      <Label>Battery health (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="mt-1.5"
                        value={mobile.batteryHealth}
                        onChange={(e) =>
                          setMobile((m) => ({ ...m, batteryHealth: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Warranty months left</Label>
                      <Input
                        type="number"
                        min={0}
                        className="mt-1.5"
                        value={mobile.warrantyMonthsLeft}
                        onChange={(e) =>
                          setMobile((m) => ({ ...m, warrantyMonthsLeft: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                    {(
                      [
                        ["boxAvailable", "Original box available"],
                        ["chargerAvailable", "Original charger available"],
                        ["earphonesAvailable", "Earphones / extras available"],
                        ["invoiceAvailable", "Invoice / bill available"],
                        ["imeiVerified", "IMEI checked / authentic"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={mobile[key]}
                          onCheckedChange={(v) => setMobile((m) => ({ ...m, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label>Photos</Label>
              <p className="text-sm text-foreground-muted">
                Front, back, sides, box, and bill help FairPrice identify the phone and condition.
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void uploadFiles(e.target.files)}
              />
              <div className="grid grid-cols-3 gap-3">
                {images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.storageKey}
                    src={img.url}
                    alt=""
                    className="aspect-square rounded-xl object-cover"
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={busy || (!images.length && !title)}
                onClick={() => void identifyFromPhotos()}
              >
                Identify product from photos
              </Button>
              {identifiedNote ? (
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm">{identifiedNote}</p>
              ) : null}
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1.5" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
                <p>
                  <strong>Product:</strong> {title || "Not set"}
                </p>
                {isMobile ? (
                  <p className="text-foreground-muted">
                    {mobile.storage} · {mobile.ram} · Box {mobile.boxAvailable ? "yes" : "no"} ·
                    Charger {mobile.chargerAvailable ? "yes" : "no"} · Invoice{" "}
                    {mobile.invoiceAvailable ? "yes" : "no"} · {mobile.warranty}
                  </p>
                ) : null}
              </div>
              <div>
                <Label>Asking price (INR)</Label>
                <Input
                  type="number"
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  className="mt-1.5"
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Original / MRP (INR)</Label>
                <Input
                  type="number"
                  value={originalPriceInr}
                  onChange={(e) => setOriginalPriceInr(e.target.value)}
                  className="mt-1.5"
                  placeholder="12499"
                />
              </div>
              <Button type="button" variant="lime" disabled={busy} onClick={() => void runPricingHint()}>
                Get FairPrice suggestion
              </Button>
              {valuationHint ? (
                <p className="rounded-xl bg-secondary px-4 py-3 text-sm leading-relaxed">
                  {valuationHint}
                </p>
              ) : null}
              {valuationFactors.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {valuationFactors.map((f) => (
                    <li key={f.name} className="flex justify-between gap-3 border-b border-border/60 py-1.5">
                      <span>
                        <strong>{f.name}</strong>
                        {f.description ? ` — ${f.description}` : ""}
                      </span>
                      {typeof f.impactInr === "number" && f.impactInr !== 0 ? (
                        <span className={f.impactInr > 0 ? "text-emerald-700" : "text-destructive"}>
                          {f.impactInr > 0 ? "+" : ""}
                          {formatInr(f.impactInr)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Title:</strong> {title}
              </p>
              <p>
                <strong>Price:</strong> {priceInr ? formatInr(Number(priceInr)) : "—"} (MRP{" "}
                {originalPriceInr ? formatInr(Number(originalPriceInr)) : "—"})
              </p>
              <p>
                <strong>Condition:</strong> {conditionGrade.replaceAll("_", " ")}
              </p>
              {isMobile ? (
                <p>
                  <strong>Specs:</strong> {mobile.storage}/{mobile.ram}, battery{" "}
                  {mobile.batteryHealth || "—"}%, box {mobile.boxAvailable ? "yes" : "no"}, charger{" "}
                  {mobile.chargerAvailable ? "yes" : "no"}
                </p>
              ) : null}
              <p>
                <strong>Photos:</strong> {images.length}
              </p>
              {listingId ? <p className="text-foreground-muted">Draft id: {listingId}</p> : null}
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <Button
              variant="outline"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={busy}>
                  Continue
                </Button>
              ) : (
                <>
                  <Button variant="outline" disabled={busy} onClick={() => void saveDraft(false)}>
                    Save draft
                  </Button>
                  <Button variant="lime" disabled={busy} onClick={() => void saveDraft(true)}>
                    Publish listing
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
          </>
        ) : null}
      </div>
    </>
  );
}
