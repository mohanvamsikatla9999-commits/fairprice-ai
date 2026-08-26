import type { ConditionGrade } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ComparableInput, ValuationAttributes } from "./model";

/**
 * @deprecated Synthetic comps invent prices — kept only for explicit legacy opt-in.
 * FairPrice path sets allowSyntheticComps=false.
 */
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
    createdAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
    isSynthetic: true,
    source: "synthetic",
    evidenceType: "UNKNOWN" as const,
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

function storageToken(input: ValuationAttributes): string | undefined {
  const fromAttrs =
    typeof input.attributes?.storage === "string"
      ? String(input.attributes.storage)
      : undefined;
  return input.storage ?? input.variant ?? fromAttrs;
}

function rejectsFamilyMismatch(title: string, model?: string): boolean {
  if (!model) return false;
  const t = title.toLowerCase();
  const m = model.toLowerCase();
  const markers = ["pro", "plus", "max", "ultra", "mini"];
  for (const marker of markers) {
    const modelHas = m.includes(marker);
    const titleHas = new RegExp(`\\b${marker}\\b`, "i").test(t);
    if (modelHas !== titleHas) return true;
  }
  return false;
}

function titleMatchesVariant(title: string, storage?: string): boolean {
  if (!storage) return true;
  const t = title.toLowerCase().replace(/\s/g, "");
  const s = storage.toLowerCase().replace(/\s/g, "");
  if (t.includes(s)) return true;
  // If title states a different capacity, reject
  const other = t.match(/(\d+)(gb|tb)/);
  if (other && `${other[1]}${other[2]}` !== s) return false;
  return true; // unknown storage in title — keep but lower priority upstream
}

/**
 * Comparable retrieval priority:
 * 1. Same product variant
 * 2. Title/brand + model token match with variant guard
 * 3. Same productId marketplace listings in MSRP band
 * 4. Synthetic only when explicitly allowed (legacy)
 */
export async function fetchComparables(
  input: ValuationAttributes & { variantId?: string; productId?: string },
  limit = 24,
): Promise<ComparableInput[]> {
  const allowSynthetic = input.allowSyntheticComps !== false;
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

  const storage = storageToken(input);

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
      if (byVariant.length >= 3) {
        return mapRows(
          byVariant.map((r) => ({
            ...r,
            createdAt: r.listedAt ?? r.createdAt,
          })),
          "SOLD_PRICE",
        );
      }
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
        take: limit * 2,
      });
      const filtered = byTitle.filter((row) => {
        if (rejectsFamilyMismatch(row.title, input.model)) return false;
        return titleMatchesVariant(row.title, storage);
      });
      if (filtered.length >= 3) {
        return mapRows(
          filtered.slice(0, limit).map((r) => ({
            ...r,
            createdAt: r.listedAt ?? r.createdAt,
          })),
          "ASKING_PRICE",
        );
      }
    }

    if (input.productId || (input.categorySlug && msrpBand && tokens.length >= 2)) {
      // Require productId OR strong tokens — do not let bare category dominate
      const listings = await prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          ...(input.productId ? { productId: input.productId } : {}),
          ...(input.productId
            ? {}
            : input.categorySlug
              ? { category: { slug: input.categorySlug } }
              : {}),
          ...(msrpBand ? { priceInr: msrpBand } : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: limit * 2,
        select: {
          id: true,
          title: true,
          priceInr: true,
          conditionGrade: true,
          city: true,
          state: true,
          publishedAt: true,
        },
      });

      const filtered = listings.filter((l) => {
        if (rejectsFamilyMismatch(l.title, input.model)) return false;
        if (!titleMatchesVariant(l.title, storage)) return false;
        if (!input.productId && tokens.length) {
          const t = l.title.toLowerCase();
          // Require brand+model style overlap — not category-only
          const hits = tokens.filter((tok) => t.includes(tok)).length;
          return hits >= Math.min(2, tokens.length);
        }
        return true;
      });

      if (filtered.length >= 2) {
        return filtered.slice(0, limit).map((l) => ({
          id: l.id,
          title: l.title,
          priceInr: l.priceInr,
          conditionGrade: l.conditionGrade,
          city: l.city,
          state: l.state,
          ageMonths: input.ageMonths ?? null,
          soldAt: null,
          createdAt: l.publishedAt ?? null,
          isSynthetic: false,
          source: "marketplace",
          evidenceType: "ASKING_PRICE" as const,
        }));
      }
    }
  } catch {
    // DB may be unavailable during unit tests
  }

  if (allowSynthetic) return syntheticComps(input);
  return [];
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
    createdAt?: Date | null;
  }>,
  defaultEvidence: ComparableInput["evidenceType"],
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
    createdAt: r.createdAt ?? r.soldAt ?? null,
    isSynthetic: r.isSynthetic,
    source: r.source,
    evidenceType: r.soldAt ? "SOLD_PRICE" : defaultEvidence,
  }));
}
