import { resolveProduct } from "@/services/valuation/product-resolver";
import { matchCatalogProduct, resolveVariantMsrp } from "@/services/valuation/catalog";
import type { AttributedValue, ProductIdentity } from "./schemas";

export type IdentityResolveInput = {
  title?: string;
  description?: string;
  categorySlug?: string;
  brand?: string;
  model?: string;
  msrpInr?: number;
  attributes?: Record<string, string | number | boolean>;
  vision?: {
    brand?: AttributedValue;
    model?: AttributedValue;
    category?: AttributedValue;
    storage?: AttributedValue;
    variant?: AttributedValue;
  };
};

function attrString(
  v: AttributedValue | undefined,
  fallback?: string,
): { value: string | null; confidence: number; source: AttributedValue["source"] } {
  if (v && v.value != null && String(v.value).trim()) {
    return {
      value: String(v.value),
      confidence: v.confidence,
      source: v.source,
    };
  }
  if (fallback?.trim()) {
    return { value: fallback.trim(), confidence: 0.7, source: "user" };
  }
  return { value: null, confidence: 0, source: "unknown" };
}

/**
 * Resolve canonical product identity. Never invent brand/model.
 */
export async function resolveProductIdentity(
  input: IdentityResolveInput,
): Promise<ProductIdentity> {
  const brandA = attrString(input.vision?.brand, input.brand);
  const modelA = attrString(input.vision?.model, input.model);
  const storageFromAttrs =
    typeof input.attributes?.storage === "string"
      ? String(input.attributes.storage)
      : undefined;
  const storageA = attrString(input.vision?.storage, storageFromAttrs);

  const labelParts = [
    brandA.value,
    modelA.value,
    storageA.value,
    input.title,
  ].filter(Boolean);
  const productLabel =
    labelParts.slice(0, 3).join(" ").trim() ||
    input.title?.trim() ||
    "Unknown item";

  const resolved = await resolveProduct({
    productLabel,
    brand: brandA.value ?? undefined,
    model: modelA.value ?? undefined,
    categorySlug: input.categorySlug,
    msrpInr: input.msrpInr,
  });

  let msrpInr = input.msrpInr ?? resolved?.msrpInr ?? null;
  if (storageA.value && resolved) {
    const cat = matchCatalogProduct(productLabel);
    if (cat) {
      msrpInr = resolveVariantMsrp(cat, storageA.value);
    }
  }

  const identityConfidence = clamp01(
    (brandA.confidence * 0.35 +
      modelA.confidence * 0.35 +
      (resolved ? 0.25 : 0) +
      (storageA.value ? storageA.confidence * 0.05 : 0)) /
      (resolved ? 1 : 0.75),
  );

  return {
    category: input.categorySlug ?? resolved?.categorySlug ?? null,
    brand: brandA.value ?? resolved?.brand ?? null,
    model: modelA.value ?? resolved?.model ?? null,
    variant: storageA.value,
    storage: storageA.value,
    identityConfidence,
    productLabel: resolved?.productLabel ?? productLabel,
    catalogProductId: resolved?.productId ?? null,
    catalogVariantId: resolved?.variantId ?? null,
    msrpInr: msrpInr && msrpInr > 0 ? msrpInr : null,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
