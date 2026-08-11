import type { CatalogProduct } from "./catalog-types";
import { INDIA_MOBILE_CATALOG } from "./catalog-mobiles";

export type { CatalogProduct } from "./catalog-types";
export { INDIA_MOBILE_CATALOG } from "./catalog-mobiles";

export function normalizeProductQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s.+]/g, " ")
    .replace(/\b(xiaomi|smartphone|mobile|phone|used|excellent|good|for sale)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchCatalogProduct(query: string): CatalogProduct | null {
  const q = normalizeProductQuery(query);
  if (!q) return null;

  let best: { product: CatalogProduct; score: number } | null = null;
  for (const product of INDIA_MOBILE_CATALOG) {
    const haystacks = [
      `${product.brand} ${product.model}`,
      ...product.aliases,
      product.slug.replace(/-/g, " "),
    ].map(normalizeProductQuery);

    for (const h of haystacks) {
      let score = 0;
      if (q === h) score = 100;
      else if (q.includes(h) || h.includes(q)) score = 92;
      else {
        const qt = new Set(q.split(" ").filter(Boolean));
        const ht = h.split(" ").filter(Boolean);
        const overlap = ht.filter((t) => qt.has(t)).length;
        if (overlap > 0) score = Math.round((overlap / Math.max(ht.length, 1)) * 85);
      }
      if (score >= 58 && (!best || score > best.score)) {
        best = { product, score };
      }
    }
  }
  return best?.product ?? null;
}

/** Max used-market share of MRP by condition (deterministic). */
export function usedShareOfMsrp(conditionScore: number): number {
  if (conditionScore >= 92) return 0.9;
  if (conditionScore >= 82) return 0.84;
  if (conditionScore >= 65) return 0.76;
  if (conditionScore >= 45) return 0.62;
  return 0.45;
}

export function resolveVariantMsrp(
  product: CatalogProduct,
  storage?: string,
): number {
  if (!storage || !product.variants?.length) return product.msrpInr;
  const hit = product.variants.find(
    (v) => v.storage?.toLowerCase() === storage.toLowerCase(),
  );
  return hit?.msrpInr ?? product.msrpInr;
}

export function listCatalogBrands(): string[] {
  return Array.from(new Set(INDIA_MOBILE_CATALOG.map((p) => p.brand))).sort();
}

export function listCatalogByBrand(brand: string): CatalogProduct[] {
  const b = brand.toLowerCase();
  return INDIA_MOBILE_CATALOG.filter((p) => p.brand.toLowerCase() === b);
}
