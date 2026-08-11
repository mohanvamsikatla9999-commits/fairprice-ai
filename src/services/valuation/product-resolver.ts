import { prisma } from "@/lib/db";
import {
  INDIA_MOBILE_CATALOG,
  matchCatalogProduct,
  normalizeProductQuery,
  type CatalogProduct,
} from "./catalog";

export type ResolvedProduct = {
  brand: string;
  model: string;
  productLabel: string;
  categorySlug: string;
  msrpInr: number;
  productId?: string;
  variantId?: string;
  slug?: string;
  confidence: number;
  source: "database" | "builtin_catalog" | "user_msrp" | "unresolved";
};

function scoreTitle(query: string, title: string): number {
  const q = normalizeProductQuery(query);
  const t = normalizeProductQuery(title);
  if (!q || !t) return 0;
  if (q === t) return 100;
  if (t.includes(q) || q.includes(t)) return 88;
  const qt = q.split(" ").filter((x) => x.length > 1);
  const tt = new Set(t.split(" ").filter((x) => x.length > 1));
  const hits = qt.filter((x) => tt.has(x)).length;
  return qt.length ? Math.round((hits / qt.length) * 85) : 0;
}

export async function resolveProduct(input: {
  productLabel?: string;
  brand?: string;
  model?: string;
  categorySlug?: string;
  msrpInr?: number;
}): Promise<ResolvedProduct | null> {
  const label =
    input.productLabel?.trim() ||
    [input.brand, input.model].filter(Boolean).join(" ").trim();
  if (!label && !input.msrpInr) return null;

  if (label) {
    // Builtin catalog first — deterministic India MRP truth for known models
    const builtin = matchCatalogProduct(label);
    if (builtin) {
      return fromBuiltin(builtin, input.msrpInr);
    }

    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(input.categorySlug
            ? { category: { slug: input.categorySlug } }
            : {}),
          OR: [
            { name: { contains: label.split(/\s+/).slice(-1)[0]!, mode: "insensitive" } },
            { brand: { contains: label.split(/\s+/)[0]!, mode: "insensitive" } },
            { slug: { contains: normalizeProductQuery(label).replace(/\s+/g, "-"), mode: "insensitive" } },
          ],
        },
        include: {
          category: { select: { slug: true } },
          variants: { where: { isActive: true }, orderBy: { msrpInr: "asc" }, take: 5 },
        },
        take: 25,
      });

      let best: { score: number; product: (typeof products)[number]; variantId?: string; msrp: number } | null =
        null;
      for (const p of products) {
        const title = `${p.brand} ${p.name}`;
        const score = Math.max(
          scoreTitle(label, title),
          scoreTitle(label, p.name),
          scoreTitle(label, p.brand),
        );
        const variant =
          p.variants.find((v) => scoreTitle(label, `${title} ${v.name}`) >= 70) ??
          p.variants[0];
        const msrp = variant?.msrpInr ?? 0;
        if (score >= 55 && msrp > 0 && (!best || score > best.score)) {
          best = { score, product: p, variantId: variant?.id, msrp };
        }
      }

      if (best) {
        return {
          brand: best.product.brand,
          model: best.product.name,
          productLabel: `${best.product.brand} ${best.product.name}`,
          categorySlug: best.product.category.slug,
          msrpInr: best.msrp,
          productId: best.product.id,
          variantId: best.variantId,
          slug: best.product.slug,
          confidence: best.score / 100,
          source: "database",
        };
      }
    } catch {
      // Prefer builtin catalog when DB is unavailable (unit tests / offline)
    }
  }

  if (input.msrpInr && input.msrpInr > 0) {
    return {
      brand: input.brand ?? "Unknown",
      model: input.model ?? label ?? "Item",
      productLabel: label || "Item",
      categorySlug: input.categorySlug ?? "mobiles",
      msrpInr: input.msrpInr,
      confidence: 0.55,
      source: "user_msrp",
    };
  }

  return null;
}

function fromBuiltin(product: CatalogProduct, userMsrp?: number): ResolvedProduct {
  const msrp =
    userMsrp && userMsrp > 0
      ? // Prefer user-entered purchase/MRP when close to catalog (±35%)
        Math.abs(userMsrp - product.msrpInr) / product.msrpInr <= 0.35
          ? userMsrp
          : product.msrpInr
      : product.msrpInr;

  return {
    brand: product.brand,
    model: product.model,
    productLabel: `${product.brand} ${product.model}`,
    categorySlug: product.categorySlug,
    msrpInr: msrp,
    slug: product.slug,
    confidence: 0.9,
    source: "builtin_catalog",
  };
}

export function listBuiltinCatalog(categorySlug?: string) {
  return INDIA_MOBILE_CATALOG.filter(
    (p) => !categorySlug || p.categorySlug === categorySlug,
  ).map((p) => ({
    brand: p.brand,
    model: p.model,
    label: `${p.brand} ${p.model}`,
    slug: p.slug,
    msrpInr: p.msrpInr,
    categorySlug: p.categorySlug,
  }));
}

export { listCatalogBrands } from "./catalog";
