import { ok } from "@/lib/api/response";
import { listBuiltinCatalog, listCatalogBrands } from "@/services/valuation/product-resolver";
import { INDIA_MOBILE_CATALOG } from "@/services/valuation/catalog";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const categorySlug = searchParams.get("category") ?? undefined;
  const brand = (searchParams.get("brand") ?? "").trim();

  const brands = listCatalogBrands();

  let builtin = listBuiltinCatalog(categorySlug).filter((p) => {
    if (brand && brand.toLowerCase() !== "all" && p.brand.toLowerCase() !== brand.toLowerCase()) {
      return false;
    }
    if (!q) return true;
    return (
      p.label.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.slug.includes(q.replace(/\s+/g, "-"))
    );
  });

  // If no query, still return a useful slice (popular/budget first for mobiles)
  if (!q && !brand) {
    builtin = [...INDIA_MOBILE_CATALOG]
      .sort((a, b) => a.msrpInr - b.msrpInr)
      .slice(0, 40)
      .map((p) => ({
        brand: p.brand,
        model: p.model,
        label: `${p.brand} ${p.model}`,
        slug: p.slug,
        msrpInr: p.msrpInr,
        categorySlug: p.categorySlug,
      }));
  }

  let dbProducts: Array<{
    brand: string;
    model: string;
    label: string;
    slug: string;
    msrpInr: number;
    categorySlug: string;
  }> = [];

  try {
    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(brand && brand.toLowerCase() !== "all"
          ? { brand: { equals: brand, mode: "insensitive" } }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: { select: { slug: true } },
        variants: {
          where: { isActive: true },
          orderBy: { msrpInr: "asc" },
          take: 1,
        },
      },
      take: 50,
    });
    dbProducts = rows
      .filter((r) => (r.variants[0]?.msrpInr ?? 0) > 0)
      .map((r) => ({
        brand: r.brand,
        model: r.name,
        label: `${r.brand} ${r.name}`,
        slug: r.slug,
        msrpInr: r.variants[0]!.msrpInr!,
        categorySlug: r.category.slug,
      }));
  } catch {
    dbProducts = [];
  }

  const map = new Map<string, (typeof builtin)[number]>();
  for (const p of builtin) map.set(p.slug, p);
  for (const p of dbProducts) map.set(p.slug, p);

  return ok({
    products: Array.from(map.values()).slice(0, 60),
    brands,
    totalCatalog: INDIA_MOBILE_CATALOG.length,
  });
}
