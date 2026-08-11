"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatInr } from "@/lib/utils";
import { INDIA_CITIES } from "@/config/india-cities";
import Link from "next/link";

const STEPS = [
  "Category",
  "Photos",
  "Details",
  "Price",
  "Location",
  "Preview",
] as const;

type CatNode = {
  id: string;
  name: string;
  slug: string;
  attributes: Array<{
    key: string;
    label: string;
    type: string;
    options: string[];
    required: boolean;
  }>;
  children: CatNode[];
};

type Uploaded = {
  storageKey: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
};

export default function SellPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<CatNode[]>([]);
  const [rootSlug, setRootSlug] = React.useState("");
  const [subSlug, setSubSlug] = React.useState("");
  const [images, setImages] = React.useState<Uploaded[]>([]);
  const [uploadPct, setUploadPct] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [conditionGrade, setConditionGrade] = React.useState("GOOD");
  const [attrs, setAttrs] = React.useState<Record<string, string>>({});
  const [priceInr, setPriceInr] = React.useState("");
  const [citySlug, setCitySlug] = React.useState("hyderabad");
  const [area, setArea] = React.useState("");
  const [sellerType, setSellerType] = React.useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL",
  );
  const [publishedId, setPublishedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setTree(j.data?.categories ?? []))
      .catch(() => setError("Could not load categories"));
  }, []);

  const root = tree.find((c) => c.slug === rootSlug);
  const sub = root?.children.find((c) => c.slug === subSlug) ?? null;
  const selected = sub ?? root;
  const attributeDefs = [
    ...(root?.attributes ?? []),
    ...(sub?.attributes ?? []),
  ];

  const city = INDIA_CITIES.find((c) => c.slug === citySlug);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const next: Uploaded[] = [...images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
          throw new Error("Only JPG, PNG, or WEBP images are allowed");
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error("Each image must be under 8MB");
        }
        setUploadPct(Math.round(((i + 0.5) / files.length) * 100));
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
        const fileData = json.data?.file ?? json.data;
        next.push({
          storageKey: fileData.storageKey ?? fileData.key,
          url: fileData.url,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        setUploadPct(Math.round(((i + 1) / files.length) * 100));
      }
      setImages(next.slice(0, 12));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setUploadPct(0);
    }
  }

  async function publish() {
    if (!selected) {
      setError("Choose a category");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const attributes = Object.entries(attrs)
        .filter(([, v]) => v.trim())
        .map(([key, value]) => ({ key, value }));
      const createRes = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selected.id,
          title,
          description,
          priceInr: Number(priceInr),
          conditionGrade,
          city: city?.name,
          state: city?.state,
          area: area || undefined,
          lat: city?.lat,
          lng: city?.lng,
          sellerType,
          attributes,
          images: images.map((img, i) => ({
            ...img,
            isPrimary: i === 0,
          })),
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createJson.error?.message ?? "Could not create listing");
      }
      const listingId = createJson.data.listing.id as string;
      const pubRes = await fetch(`/api/listings/${listingId}/publish`, {
        method: "POST",
      });
      const pubJson = await pubRes.json();
      if (!pubRes.ok) {
        throw new Error(pubJson.error?.message ?? "Could not publish");
      }
      setPublishedId(listingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  function canNext() {
    if (step === 0) return Boolean(selected);
    if (step === 1) return images.length > 0;
    if (step === 2) return title.trim().length >= 3 && description.trim().length >= 10;
    if (step === 3) return Number(priceInr) > 0;
    if (step === 4) return Boolean(city);
    return true;
  }

  if (publishedId) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Listing published</h1>
        <p className="mt-2 text-foreground-muted">
          Your ad is live. Share it or manage it anytime from My Listings.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={`/product/${publishedId}`}>View listing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-listings">Manage listings</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const url = `${window.location.origin}/product/${publishedId}`;
              void navigator.clipboard.writeText(url);
            }}
          >
            Copy link
          </Button>
        </div>
        <p className="mt-8 text-sm text-foreground-muted">
          Optional:{" "}
          <Link href={`/product/${publishedId}`} className="text-primary hover:underline">
            check FairPrice later
          </Link>{" "}
          from the listing page.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <PageHero
        title="Sell an item"
        description="Multi-step classifieds flow — no valuation required to publish."
      />
      <div className="mt-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <p className="mt-2 text-sm text-foreground-muted">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8 max-w-2xl space-y-6">
        {step === 0 ? (
          <>
            <div>
              <Label>Category</Label>
              <Select
                value={rootSlug}
                onValueChange={(v) => {
                  setRootSlug(v);
                  setSubSlug("");
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {tree.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {root?.children?.length ? (
              <div>
                <Label>Subcategory</Label>
                <Select value={subSlug} onValueChange={setSubSlug}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {root.children.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <Label htmlFor="photos">Photos (up to 12)</Label>
            <Input
              id="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(e) => void uploadFiles(e.target.files)}
            />
            {uploadPct > 0 ? <Progress value={uploadPct} /> : null}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div key={img.storageKey} className="relative overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-square object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. iPhone 15 128GB Blue"
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                className="mt-2 min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
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
            {attributeDefs.map((def) => (
              <div key={def.key}>
                <Label>
                  {def.label}
                  {def.required ? " *" : ""}
                </Label>
                {def.options?.length ? (
                  <Select
                    value={attrs[def.key] ?? ""}
                    onValueChange={(v) =>
                      setAttrs((prev) => ({ ...prev, [def.key]: v }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={`Select ${def.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {def.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="mt-2"
                    value={attrs[def.key] ?? ""}
                    onChange={(e) =>
                      setAttrs((prev) => ({ ...prev, [def.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price (INR)</Label>
              <Input
                id="price"
                type="number"
                className="mt-2"
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
                min={1}
              />
              {Number(priceInr) > 0 ? (
                <p className="mt-2 text-sm text-foreground-muted">
                  Asking {formatInr(Number(priceInr))}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Seller type</Label>
              <Select
                value={sellerType}
                onValueChange={(v) =>
                  setSellerType(v as "INDIVIDUAL" | "BUSINESS")
                }
              >
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
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <Label>City</Label>
              <Select
                value={citySlug}
                onValueChange={(v) => {
                  setCitySlug(v);
                  setArea("");
                }}
              >
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
            {city?.areas?.length ? (
              <div>
                <Label>Area</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose area" />
                  </SelectTrigger>
                  <SelectContent>
                    {city.areas.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3 rounded-2xl border border-border p-5">
            <h3 className="font-display text-xl font-semibold">{title}</h3>
            <p className="text-lg font-medium">{formatInr(Number(priceInr) || 0)}</p>
            <p className="text-sm text-foreground-muted">
              {[area, city?.name, city?.state].filter(Boolean).join(", ")}
            </p>
            <p className="text-sm">{description}</p>
            <p className="text-xs text-foreground-muted">
              {selected?.name} · {images.length} photos · {conditionGrade.replaceAll("_", " ")}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={busy || !canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={() => void publish()}>
              {busy ? "Publishing…" : "Publish listing"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => router.push("/my-listings")}>
            My listings
          </Button>
        </div>
      </div>
    </div>
  );
}
