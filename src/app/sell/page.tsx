"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  RotateCcw,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Monitor,
  Tablet,
  Car,
  Sofa,
  Package,
  ShoppingBag,
  Refrigerator,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { cn, formatInr } from "@/lib/utils";
import { INDIA_CITIES } from "@/config/india-cities";

// ─── Types ───────────────────────────────────────────────────────────────────

type ScanResult = {
  brand: string;
  model: string;
  productLabel: string;
  categorySlug: string;
  estimatedMrpInr: number | null;
  confidence: number | null | undefined;
  conditionGrade: ConditionGrade;
  conditionSummary: string;
  visibleDamage: string[] | null | undefined;
  specs: Record<string, string | number | null> | null | undefined;
  suggestedTitle: string;
  suggestedDescription: string;
  insufficientQuality: boolean;
  notes: string;
};

type PriceResult = {
  fairRangeMinInr: number;
  fairRangeMaxInr: number;
  recommendedListingInr: number;
  quickSaleInr: number;
  verdict: "UNDERPRICED" | "FAIR" | "SLIGHTLY_HIGH" | "OVERPRICED";
  demandLevel: "LOW" | "MEDIUM" | "HIGH";
  depreciation: number;
  explanation: string;
  sellerTips: string[];
  buyerWarnings: string[];
  confidence: number;
  marketTrend: "RISING" | "STABLE" | "FALLING";
  priceFactors: { factor: string; impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; detail: string }[];
};

type ConditionGrade = "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

type UploadedImage = {
  storageKey: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
};

type Step = "category" | "photos" | "specs" | "price" | "publish";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "mobiles", label: "Mobile Phone", icon: Smartphone, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { slug: "laptops", label: "Laptop", icon: Laptop, color: "bg-purple-50 text-purple-600 border-purple-200" },
  { slug: "tvs", label: "TV", icon: Tv, color: "bg-green-50 text-green-600 border-green-200" },
  { slug: "tablets", label: "Tablet", icon: Tablet, color: "bg-orange-50 text-orange-600 border-orange-200" },
  { slug: "headphones", label: "Headphones", icon: Headphones, color: "bg-pink-50 text-pink-600 border-pink-200" },
  { slug: "computers", label: "Desktop / PC", icon: Monitor, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { slug: "cars", label: "Car / Bike", icon: Car, color: "bg-red-50 text-red-600 border-red-200" },
  { slug: "appliances", label: "Appliances", icon: Refrigerator, color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  { slug: "furniture", label: "Furniture", icon: Sofa, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { slug: "fashion", label: "Fashion", icon: ShoppingBag, color: "bg-rose-50 text-rose-600 border-rose-200" },
  { slug: "electronics", label: "Electronics", icon: Package, color: "bg-teal-50 text-teal-600 border-teal-200" },
  { slug: "other", label: "Other", icon: Package, color: "bg-gray-50 text-gray-600 border-gray-200" },
];

const CONDITION_OPTIONS: { value: ConditionGrade; label: string; desc: string }[] = [
  { value: "LIKE_NEW", label: "Like New", desc: "Barely used, no marks" },
  { value: "EXCELLENT", label: "Excellent", desc: "Minor signs of use" },
  { value: "GOOD", label: "Good", desc: "Normal wear, fully working" },
  { value: "FAIR", label: "Fair", desc: "Visible wear, works fine" },
  { value: "POOR", label: "Poor", desc: "Heavy wear or damage" },
];

// Spec field labels for display
const SPEC_LABELS: Record<string, string> = {
  ram: "RAM",
  storage: "Storage",
  battery_mah: "Battery (mAh)",
  battery_wh: "Battery (Wh)",
  display_inch: "Screen Size (inch)",
  processor: "Processor",
  os: "Operating System",
  rear_camera_mp: "Rear Camera (MP)",
  front_camera_mp: "Front Camera (MP)",
  color: "Color",
  network: "Network",
  warranty_months: "Warranty Remaining (months)",
  box_contents: "Box Contents",
  condition_detail: "Condition Details",
  gpu: "GPU",
  resolution: "Resolution",
  panel_type: "Panel Type",
  smart_tv: "Smart TV",
  hdmi_ports: "HDMI Ports",
  megapixels: "Megapixels",
  sensor_type: "Sensor Type",
  lens_included: "Lens Included",
  video_resolution: "Video Resolution",
  type: "Type",
  connectivity: "Connectivity",
  anc: "Active Noise Cancellation",
  battery_hours: "Battery Life (hours)",
  cellular: "Cellular / LTE",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "photos", label: "Photos" },
  { key: "specs", label: "Details" },
  { key: "price", label: "FairPrice" },
  { key: "publish", label: "Publish" },
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div
              className={cn(
                "flex h-8 min-w-max items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                active && "bg-primary text-white",
                done && "bg-primary/10 text-primary",
                !active && !done && "bg-secondary text-foreground-muted",
              )}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                    active ? "bg-white text-primary" : "bg-border text-foreground-muted",
                  )}
                >
                  {i + 1}
                </span>
              )}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-border" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SellPage() {
  const router = useRouter();

  // Mounted guard — prevents SSR/client HTML mismatch on auth-gated content
  const [mounted, setMounted] = React.useState(false);

  // Auth
  const [authChecked, setAuthChecked] = React.useState(false);
  const [authenticated, setAuthenticated] = React.useState(false);

  // Flow state
  const [step, setStep] = React.useState<Step>("category");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Category
  const [categorySlug, setCategorySlug] = React.useState("");

  // Photos
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [uploadPct, setUploadPct] = React.useState(0);

  // AI scan
  const [scanning, setScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<ScanResult | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);

  // Specs / details
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [condition, setCondition] = React.useState<ConditionGrade>("GOOD");
  const [specs, setSpecs] = React.useState<Record<string, string>>({});
  const [citySlug, setCitySlug] = React.useState("hyderabad");
  const [ageMonths, setAgeMonths] = React.useState("");
  const [sellerType, setSellerType] = React.useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");

  // Price
  const [priceResult, setPriceResult] = React.useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = React.useState(false);
  const [customPrice, setCustomPrice] = React.useState("");

  // Publish
  const [publishedId, setPublishedId] = React.useState<string | null>(null);

  // ── Mount + auth check ──────────────────────────────────────────────────────
  React.useEffect(() => {
    setMounted(true);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok || !json.data?.user) {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Upload helpers ──────────────────────────────────────────────────────────
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const next: UploadedImage[] = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
        if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
          throw new Error("Only JPG, PNG, or WEBP images are allowed");
        }
        if (file.size > 8 * 1024 * 1024) throw new Error("Each image must be under 8MB");
        setUploadPct(Math.round(((i + 0.5) / files.length) * 100));
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (res.status === 401) { router.push(`/login?next=/sell`); return; }
        if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
        const fd = json.data?.file ?? json.data;
        next.push({ storageKey: fd.storageKey ?? fd.key, url: fd.url, mimeType: mime, sizeBytes: file.size });
        setUploadPct(Math.round(((i + 1) / files.length) * 100));
      }
      setImages(next.slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setUploadPct(0);
    }
  }

  // ── AI scan ─────────────────────────────────────────────────────────────────
  async function runScan() {
    if (images.length === 0) return;
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await fetch("/api/ai/scan-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: images.map((i) => i.url),
          categorySlug: categorySlug || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message ?? "Scan failed");

      // Normalize Gemini response — it may use snake_case or camelCase field names
      const raw = json.data.product as Record<string, unknown>;
      const product: ScanResult = {
        brand: String(raw.brand ?? ""),
        model: String(raw.model ?? ""),
        productLabel: String(raw.productLabel ?? raw.product_label ?? raw.brand ?? ""),
        categorySlug: String(raw.categorySlug ?? raw.category_slug ?? raw.category ?? categorySlug ?? "mobiles"),
        estimatedMrpInr: Number(raw.estimatedMrpInr ?? raw.estimated_mrp_inr ?? raw.mrp ?? 0) || null,
        confidence: Number(raw.confidence ?? 0.8),
        conditionGrade: (
          (raw.conditionGrade ?? raw.condition_grade ?? raw.condition ?? "GOOD") as string
        ).toUpperCase().replace(" ", "_") as ConditionGrade,
        conditionSummary: String(raw.conditionSummary ?? raw.condition_summary ?? raw.condition_detail ?? ""),
        visibleDamage: Array.isArray(raw.visibleDamage ?? raw.visible_damage)
          ? (raw.visibleDamage ?? raw.visible_damage) as string[]
          : [],
        specs: (raw.specs && typeof raw.specs === "object" ? raw.specs : {}) as Record<string, string | number | null>,
        suggestedTitle: String(raw.suggestedTitle ?? raw.suggested_title ?? raw.title ?? ""),
        suggestedDescription: String(raw.suggestedDescription ?? raw.suggested_description ?? raw.description ?? ""),
        insufficientQuality: Boolean(raw.insufficientQuality ?? raw.insufficient_quality ?? false),
        notes: String(raw.notes ?? ""),
      };

      setScanResult(product);

      // Pre-fill form fields from scan
      if (product.suggestedTitle?.trim()) setTitle(product.suggestedTitle.trim());
      if (product.suggestedDescription?.trim()) setDescription(product.suggestedDescription.trim());
      if (product.conditionGrade) setCondition(product.conditionGrade);
      if (product.specs && typeof product.specs === "object") {
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(product.specs)) {
          if (v !== null && v !== undefined && String(v).trim() !== "") {
            cleaned[k] = String(v);
          }
        }
        setSpecs(cleaned);
      }
      if (product.categorySlug && !categorySlug) setCategorySlug(product.categorySlug);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  // ── Smart price ─────────────────────────────────────────────────────────────
  async function fetchPrice() {
    setPriceLoading(true);
    setPriceResult(null);
    const city = INDIA_CITIES.find((c) => c.slug === citySlug);
    try {
      const res = await fetch("/api/ai/smart-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productLabel: scanResult?.productLabel ?? title,
          brand: scanResult?.brand,
          model: scanResult?.model,
          categorySlug: categorySlug || "electronics",
          conditionGrade: condition,
          conditionSummary: scanResult?.conditionSummary,
          visibleDamage: scanResult?.visibleDamage ?? [],
          specs: Object.fromEntries(
            Object.entries(specs).filter(([, v]) => v.trim() !== ""),
          ),
          city: city?.name ?? "Hyderabad",
          estimatedMrpInr: scanResult?.estimatedMrpInr ?? null,
          ageMonths: ageMonths ? Number(ageMonths) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message ?? "Price fetch failed");
      const pricing = json.data.pricing as PriceResult;
      setPriceResult(pricing);
      // Default custom price to recommended
      if (!customPrice && pricing.recommendedListingInr) {
        setCustomPrice(String(pricing.recommendedListingInr));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Price fetch failed");
    } finally {
      setPriceLoading(false);
    }
  }

  // ── Publish ──────────────────────────────────────────────────────────────────
  async function publish() {
    if (!categorySlug) { setError("Choose a category"); return; }
    setBusy(true);
    setError(null);
    const city = INDIA_CITIES.find((c) => c.slug === citySlug);
    const priceInr = Number(customPrice);
    if (!priceInr || priceInr <= 0) { setError("Enter a valid price"); setBusy(false); return; }

    try {
      // Fetch category id
      const catRes = await fetch("/api/categories");
      const catJson = await catRes.json();
      const allCats: { id: string; slug: string; children: { id: string; slug: string }[] }[] =
        catJson.data?.categories ?? [];
      let categoryId = "";
      for (const c of allCats) {
        if (c.slug === categorySlug || c.slug.includes(categorySlug) || categorySlug.includes(c.slug)) {
          categoryId = c.id;
          break;
        }
        for (const sub of c.children ?? []) {
          if (sub.slug === categorySlug || sub.slug.includes(categorySlug) || categorySlug.includes(sub.slug)) {
            categoryId = sub.id;
            break;
          }
        }
        if (categoryId) break;
      }
      // Fallback: first category
      if (!categoryId && allCats[0]) categoryId = allCats[0].id;

      const attributes = Object.entries(specs)
        .filter(([, v]) => v.trim())
        .map(([key, value]) => ({ key, value }));

      const createRes = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          description: description.trim(),
          priceInr,
          conditionGrade: condition,
          city: city?.name,
          state: city?.state,
          lat: city?.lat,
          lng: city?.lng,
          sellerType,
          attributes,
          images: images.map((img, i) => ({ ...img, isPrimary: i === 0 })),
        }),
      });
      const createJson = await createRes.json();
      if (createRes.status === 401) { router.push(`/login?next=/sell`); return; }
      if (!createRes.ok) throw new Error(createJson.error?.message ?? "Could not create listing");

      const listingId = createJson.data.listing.id as string;
      const pubRes = await fetch(`/api/listings/${listingId}/publish`, { method: "POST" });
      const pubJson = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubJson.error?.message ?? "Could not publish");

      setPublishedId(listingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────────────────────────

  // Before mount: render nothing (avoids SSR/client HTML mismatch)
  if (!mounted || !authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Tag className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Sell with AI</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Sign in to upload photos and let AI identify your product, fill specs, and suggest the right price.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild><Link href="/login?next=/sell">Sign in</Link></Button>
            <Button asChild variant="outline"><Link href="/register?next=/sell">Create account</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (publishedId) {
    return (
      <div className="container-page py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-bold">Listing Published!</h1>
        <p className="mt-2 text-foreground-muted">Your ad is live on FairPrice AI.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link href={`/product/${publishedId}`}>View listing</Link></Button>
          <Button variant="outline" asChild><Link href="/my-listings">My listings</Link></Button>
          <Button variant="ghost" onClick={() => {
            void navigator.clipboard.writeText(`${window.location.origin}/product/${publishedId}`);
          }}>Copy link</Button>
        </div>
      </div>
    );
  }

  const selectedCat = CATEGORIES.find((c) => c.slug === categorySlug);
  const city = INDIA_CITIES.find((c) => c.slug === citySlug);

  // Spec keys to show based on current category
  const specKeysInScan = scanResult
    ? Object.keys(scanResult.specs ?? {}).filter((k) => {
        const v = (scanResult.specs ?? {})[k];
        return v !== null && v !== undefined && String(v).trim() !== "";
      })
    : [];
  const extraSpecKeys = scanResult
    ? Object.keys(scanResult.specs ?? {})
        .filter((k) => !specKeysInScan.includes(k) || !(specs[k] ?? "").trim())
    : [];
  const allSpecKeys = Array.from(new Set([...specKeysInScan, ...extraSpecKeys]));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f7ff] to-white">
      {/* Header */}
      <div className="border-b border-border/70 bg-white/80 backdrop-blur-sm">
        <div className="container-page py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Sell an item</h1>
              <p className="text-sm text-foreground-muted">AI-powered — snap photos, we do the rest</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-listings">My listings</Link>
            </Button>
          </div>
          <div className="mt-4">
            <StepBar current={step} />
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* ── STEP 1: Category ─────────────────────────────────────────────── */}
        {step === "category" && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 font-display text-xl font-semibold">What are you selling?</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = categorySlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setCategorySlug(cat.slug)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all hover:scale-[1.03] active:scale-[0.97]",
                      active
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border bg-white hover:border-primary/30",
                    )}
                  >
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", cat.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={cn("text-xs font-medium", active ? "text-primary" : "text-foreground")}>
                      {cat.label}
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                disabled={!categorySlug}
                onClick={() => {
                  setError(null);
                  setStep("photos");
                }}
                size="lg"
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Photos + AI scan ─────────────────────────────────────── */}
        {step === "photos" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-3">
              {selectedCat && (
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", selectedCat.color)}>
                  <selectedCat.icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <h2 className="font-display text-xl font-semibold">Upload photos</h2>
                <p className="text-sm text-foreground-muted">
                  Front, back, sides, box — AI reads everything
                </p>
              </div>
            </div>

            {/* Upload zone */}
            <label
              htmlFor="photo-upload"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors",
                busy ? "opacity-50" : "hover:border-primary/50 hover:bg-primary/3",
                images.length === 0 ? "border-border" : "border-primary/40 bg-primary/5",
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ImagePlus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Click to add photos</p>
                <p className="mt-1 text-sm text-foreground-muted">JPG, PNG, WEBP · max 8MB each · up to 8 photos</p>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => void uploadFiles(e.target.files)}
              />
            </label>

            {uploadPct > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-foreground-muted">Uploading… {uploadPct}%</p>
                <Progress value={uploadPct} />
              </div>
            )}

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={img.storageKey} className="group relative overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI scan section */}
            {images.length > 0 && !scanResult && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">AI Product Scanner</p>
                    <p className="text-sm text-foreground-muted">
                      Gemini will identify your product and fill in all specs automatically
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => void runScan()}
                  disabled={scanning}
                  size="lg"
                >
                  {scanning ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Scanning with AI…</>
                  ) : (
                    <><Camera className="h-5 w-5" /> Scan & Identify Product</>
                  )}
                </Button>
              </div>
            )}

            {/* Scan result badge */}
            {scanResult && !scanResult.insufficientQuality && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <div className="min-w-0">
                    <p className="font-semibold text-green-800">
                      {scanResult.productLabel}
                    </p>
                    <p className="mt-0.5 text-sm text-green-700">
                      {scanResult.conditionSummary}
                      {scanResult.estimatedMrpInr
                        ? ` · MRP ~${formatInr(scanResult.estimatedMrpInr)}`
                        : ""}
                    </p>
                    {(scanResult.visibleDamage?.length ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-amber-700">
                        ⚠ {scanResult.visibleDamage!.join(", ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-green-600">
                      {(Number(scanResult.confidence) || 0) > 0
                        ? `Confidence ${Math.round((Number(scanResult.confidence) || 0) * 100)}%`
                        : "Product identified"
                      } · All specs pre-filled
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto shrink-0 text-green-600 hover:text-green-800"
                    onClick={() => { setScanResult(null); setScanError(null); }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {scanResult?.insufficientQuality && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Photos unclear for AI scan</p>
                <p className="mt-1">You can still continue and fill in details manually.</p>
              </div>
            )}

            {scanError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {scanError} — you can still continue manually.
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep("category")}>Back</Button>
              <Button
                disabled={images.length === 0 || busy || scanning}
                onClick={() => { setError(null); setStep("specs"); }}
                size="lg"
              >
                {scanResult ? "Continue with AI details" : "Continue manually"}
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Specs / details ───────────────────────────────────────── */}
        {step === "specs" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                {scanResult ? "Review AI-filled details" : "Product details"}
              </h2>
              {scanResult && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> AI filled
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
              <div>
                <Label htmlFor="title">Listing title *</Label>
                <Input
                  id="title"
                  className="mt-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. POCO M7 6GB/128GB Midnight Blue"
                />
              </div>

              <div>
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  className="mt-2 min-h-28"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Condition, accessories included, reason for selling…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Condition *</Label>
                  <div className="mt-2 space-y-2">
                    {CONDITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCondition(opt.value)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          condition === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-white hover:border-primary/30",
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 shrink-0 rounded-full border-2",
                          condition === opt.value ? "border-primary bg-primary" : "border-border",
                        )} />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-foreground-muted">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>City</Label>
                    <Select value={citySlug} onValueChange={setCitySlug}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIA_CITIES.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}, {c.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    />
                  </div>

                  <div>
                    <Label>Seller type</Label>
                    <Select value={sellerType} onValueChange={(v) => setSellerType(v as "INDIVIDUAL" | "BUSINESS")}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs from AI */}
            {allSpecKeys.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Product specifications</h3>
                  <span className="text-xs text-foreground-muted">(edit if incorrect)</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allSpecKeys.map((key) => (
                    <div key={key}>
                      <Label htmlFor={`spec-${key}`} className="text-xs">
                        {SPEC_LABELS[key] ?? key.replace(/_/g, " ")}
                      </Label>
                      <Input
                        id={`spec-${key}`}
                        className="mt-1 h-9 text-sm"
                        value={specs[key] ?? ""}
                        onChange={(e) =>
                          setSpecs((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={`Enter ${SPEC_LABELS[key] ?? key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep("photos")}>Back</Button>
              <Button
                disabled={title.trim().length < 3 || description.trim().length < 10}
                onClick={() => {
                  setError(null);
                  setStep("price");
                  void fetchPrice();
                }}
                size="lg"
              >
                Get FairPrice
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            {title.trim().length < 3 && (
              <p className="text-xs text-foreground-muted">Title must be at least 3 characters.</p>
            )}
          </div>
        )}

        {/* ── STEP 4: FairPrice ─────────────────────────────────────────────── */}
        {step === "price" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <h2 className="font-display text-xl font-semibold">FairPrice estimate</h2>

            {priceLoading && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 py-14">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium text-primary">Analysing market prices…</p>
                <p className="text-sm text-foreground-muted">
                  Comparing with current India resale data
                </p>
              </div>
            )}

            {priceResult && !priceLoading && (
              <>
                {/* Main price card */}
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        FairPrice AI
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold">
                        {formatInr(priceResult.fairRangeMinInr)} – {formatInr(priceResult.fairRangeMaxInr)}
                      </p>
                      <p className="mt-1 text-sm text-foreground-muted">
                        Fair resale range · {Math.round(priceResult.confidence * 100)}% confidence
                      </p>
                    </div>
                    <DemandBadge level={priceResult.demandLevel} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <PriceStat label="Recommended" value={formatInr(priceResult.recommendedListingInr)} highlight />
                    <PriceStat label="Quick sale" value={formatInr(priceResult.quickSaleInr)} />
                    <PriceStat
                      label="Depreciation"
                      value={`${priceResult.depreciation}%`}
                    />
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <TrendIcon trend={priceResult.marketTrend} />
                    <span className="text-sm text-foreground-muted">
                      Market is <strong>{priceResult.marketTrend.toLowerCase()}</strong>
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-foreground-muted">{priceResult.explanation}</p>

                  {priceResult.priceFactors?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {priceResult.priceFactors.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={cn(
                            "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                            f.impact === "POSITIVE" ? "bg-green-500"
                            : f.impact === "NEGATIVE" ? "bg-red-400"
                            : "bg-border",
                          )} />
                          <span>
                            <strong>{f.factor}</strong>: {f.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller tips */}
                {priceResult.sellerTips?.length > 0 && (
                  <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-semibold">Tips to sell faster</h3>
                    <ul className="space-y-2">
                      {priceResult.sellerTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Set your price */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <h3 className="mb-3 font-semibold">Set your listing price</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground-muted">₹</span>
                    <Input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-12 text-lg font-bold"
                      min={1}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomPrice(String(priceResult.recommendedListingInr))}
                      className="rounded-full border border-primary/30 bg-white px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      Use recommended {formatInr(priceResult.recommendedListingInr)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrice(String(priceResult.quickSaleInr))}
                      className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      Quick sale {formatInr(priceResult.quickSaleInr)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPrice(String(priceResult.fairRangeMaxInr))}
                      className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary"
                    >
                      Top of range {formatInr(priceResult.fairRangeMaxInr)}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep("specs")}>Back</Button>
              <Button
                disabled={!customPrice || Number(customPrice) <= 0 || priceLoading}
                onClick={() => { setError(null); setStep("publish"); }}
                size="lg"
              >
                Review & Publish
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Preview & publish ─────────────────────────────────────── */}
        {step === "publish" && (
          <div className="mx-auto max-w-2xl space-y-5">
            <h2 className="font-display text-xl font-semibold">Review & publish</h2>

            {/* Preview card */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              {images.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {images.slice(0, 4).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.storageKey}
                      src={img.url}
                      alt=""
                      className={cn(
                        "h-20 w-20 shrink-0 rounded-xl object-cover",
                        i === 0 && "ring-2 ring-primary ring-offset-1",
                      )}
                    />
                  ))}
                  {images.length > 4 && (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-medium text-foreground-muted">
                      +{images.length - 4}
                    </div>
                  )}
                </div>
              )}

              <h3 className="font-display text-xl font-bold">{title}</h3>
              <p className="mt-1 font-display text-2xl font-bold text-primary">
                {formatInr(Number(customPrice))}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {selectedCat && (
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                    {selectedCat.label}
                  </span>
                )}
                <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                  {condition.replaceAll("_", " ")}
                </span>
                {city && (
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                    {city.name}, {city.state}
                  </span>
                )}
                <span className="rounded-full border border-border bg-secondary px-2.5 py-1">
                  {images.length} photo{images.length !== 1 ? "s" : ""}
                </span>
              </div>

              <p className="mt-3 text-sm text-foreground-muted">{description}</p>

              {/* Specs summary */}
              {Object.entries(specs).filter(([, v]) => v.trim()).length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-secondary/50 p-3 text-xs">
                  {Object.entries(specs)
                    .filter(([, v]) => v.trim())
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-1.5">
                        <span className="text-foreground-muted">{SPEC_LABELS[k] ?? k.replace(/_/g, " ")}:</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                </div>
              )}

              {priceResult && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-800">
                    FairPrice range {formatInr(priceResult.fairRangeMinInr)}–{formatInr(priceResult.fairRangeMaxInr)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep("price")}>Back</Button>
              <Button
                disabled={busy}
                onClick={() => void publish()}
                size="lg"
                variant="lime"
              >
                {busy ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Publishing…</>
                ) : (
                  <><Tag className="h-5 w-5" /> Publish listing</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function PriceStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-3 text-center",
      highlight ? "border-primary/30 bg-primary/5" : "border-border",
    )}>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className={cn("mt-0.5 font-bold", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function DemandBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const cfg = {
    HIGH: { label: "High demand", cls: "bg-green-100 text-green-700 border-green-200" },
    MEDIUM: { label: "Medium demand", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    LOW: { label: "Low demand", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  }[level];
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: "RISING" | "STABLE" | "FALLING" }) {
  if (trend === "RISING") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === "FALLING") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-foreground-muted" />;
}
