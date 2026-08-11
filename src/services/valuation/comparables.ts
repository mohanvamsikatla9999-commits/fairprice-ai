import type { ConditionGrade } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ComparableInput, ValuationAttributes } from "./model";

function syntheticComps(input: ValuationAttributes): ComparableInput[] {
  const base =
    input.msrpInr && input.msrpInr > 0
      ? Math.round(input.msrpInr * 0.7)
      : input.askingPriceInr && input.askingPriceInr > 0
        ? input.askingPriceInr
        : 15_000;

  const label =
    input.productLabel ??
    ([input.brand, input.model].filter(Boolean).join(" ") || "Item");
  const city = input.city ?? "Bengaluru";
  const grades: ConditionGrade[] = ["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "GOOD"];
  const spreads = [1.08, 1.03, 1.0, 0.9, 0.95, 1.05, 0.88, 0.98];

  return spreads.map((mult, i) => ({
    id: `synth_${i}`,
    title: `${label} comparable #${i + 1}`,
    priceInr: Math.max(500, Math.round(base * mult)),
    conditionGrade: grades[i % grades.length],
    city,
    state: input.state ?? "Karnataka",
    ageMonths: (input.ageMonths ?? 12) + (i - 3) * 2,
    soldAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
    isSynthetic: true,
    source: "synthetic",
  }));
}

function titleTokens(input: ValuationAttributes): string[] {
  const raw = [input.brand, input.model, input.productLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return raw
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 6);
}

/**
 * Comparable retrieval priority:
 * 1. Same product variant
 * 2. Title/brand token match
 * 3. Same productId marketplace listings in MSRP band
 * 4. Synthetic comps from MSRP/asking (same product economics)
 */
export async function fetchComparables(
  input: ValuationAttributes & { variantId?: string; productId?: string },
  limit = 24,
): Promise<ComparableInput[]> {
  const msrpBand =
    input.msrpInr && input.msrpInr > 0
      ? {
          gte: Math.round(input.msrpInr * 0.3),
          lte: Math.round(input.msrpInr * 1.02),
        }
      : input.askingPriceInr
        ? {
            gte: Math.round(input.askingPriceInr * 0.5),
            lte: Math.round(input.askingPriceInr * 1.6),
          }
        : undefined;

  try {
    if (input.variantId) {
      const byVariant = await prisma.comparableListing.findMany({
        where: {
          variantId: input.variantId,
          ...(msrpBand ? { priceInr: msrpBand } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (byVariant.length >= 3) return mapRows(byVariant);
    }

    const tokens = titleTokens(input);
    if (tokens.length > 0) {
      const byTitle = await prisma.comparableListing.findMany({
        where: {
          AND: [
            ...tokens.slice(0, 2).map((token) => ({
              title: { contains: token, mode: "insensitive" as const },
            })),
            ...(msrpBand ? [{ priceInr: msrpBand }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (byTitle.length >= 3) return mapRows(byTitle);
    }

    if (input.productId || (input.categorySlug && msrpBand)) {
      const listings = await prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          ...(input.productId ? { productId: input.productId } : {}),
          ...(input.categorySlug && !input.productId
            ? { category: { slug: input.categorySlug } }
            : {}),
          ...(msrpBand ? { priceInr: msrpBand } : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          priceInr: true,
          conditionGrade: true,
          city: true,
          state: true,
        },
      });

      // Prefer listings whose title overlaps product tokens
      const filtered = tokens.length
        ? listings.filter((l) => {
            const t = l.title.toLowerCase();
            return tokens.some((tok) => t.includes(tok));
          })
        : listings;

      const use = filtered.length >= 2 ? filtered : listings;
      if (use.length >= 2) {
        return use.map((l) => ({
          id: l.id,
          title: l.title,
          priceInr: l.priceInr,
          conditionGrade: l.conditionGrade,
          city: l.city,
          state: l.state,
          ageMonths: input.ageMonths ?? null,
          soldAt: null,
          isSynthetic: false,
          source: "marketplace",
        }));
      }
    }
  } catch {
    // DB may be unavailable during unit tests
  }

  return syntheticComps(input);
}

function mapRows(
  rows: Array<{
    id: string;
    title: string;
    priceInr: number;
    conditionGrade: ConditionGrade | null;
    city: string | null;
    state: string | null;
    ageMonths: number | null;
    soldAt: Date | null;
    isSynthetic: boolean;
    source: string;
  }>,
): ComparableInput[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    priceInr: r.priceInr,
    conditionGrade: r.conditionGrade,
    city: r.city,
    state: r.state,
    ageMonths: r.ageMonths,
    soldAt: r.soldAt,
    isSynthetic: r.isSynthetic,
    source: r.source,
  }));
}
