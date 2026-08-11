import type { ConditionGrade, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { distanceKm } from "@/config/india-cities";

export type SearchFilters = {
  query?: string;
  categorySlug?: string | null;
  minPriceInr?: number | null;
  maxPriceInr?: number | null;
  city?: string | null;
  state?: string | null;
  conditionGrade?: ConditionGrade | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "distance";
  page?: number;
  pageSize?: number;
};

export type SearchResultItem = {
  id: string;
  title: string;
  slug: string;
  priceInr: number;
  conditionGrade: ConditionGrade;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm?: number;
  isFeatured?: boolean;
  isBoosted?: boolean;
  category: { id: string; name: string; slug: string };
  images: Array<{ url: string; alt: string | null }>;
};

export type SearchResult = {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
};

function buildOrderBy(
  sort: SearchFilters["sort"],
): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ priceInr: "asc" }];
    case "price_desc":
      return [{ priceInr: "desc" }];
    case "newest":
      return [{ publishedAt: "desc" }];
    case "distance":
    case "relevance":
    default:
      return [{ isFeatured: "desc" }, { isBoosted: "desc" }, { publishedAt: "desc" }];
  }
}

export class SearchService {
  async search(filters: SearchFilters): Promise<SearchResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 24));
    const skip = (page - 1) * pageSize;
    const useDistance =
      typeof filters.lat === "number" &&
      typeof filters.lng === "number" &&
      (filters.radiusKm != null || filters.sort === "distance");

    const keywords = (filters.query ?? "")
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 1);

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
      deletedAt: null,
      ...(filters.categorySlug
        ? { category: { slug: filters.categorySlug } }
        : {}),
      ...(filters.city
        ? { city: { equals: filters.city, mode: "insensitive" } }
        : {}),
      ...(filters.state
        ? { state: { equals: filters.state, mode: "insensitive" } }
        : {}),
      ...(filters.conditionGrade ? { conditionGrade: filters.conditionGrade } : {}),
      ...(filters.minPriceInr !== undefined && filters.minPriceInr !== null
        ? { priceInr: { gte: filters.minPriceInr } }
        : {}),
      ...(filters.maxPriceInr !== undefined && filters.maxPriceInr !== null
        ? {
            priceInr: {
              ...(filters.minPriceInr !== undefined && filters.minPriceInr !== null
                ? { gte: filters.minPriceInr }
                : {}),
              lte: filters.maxPriceInr,
            },
          }
        : {}),
      ...(keywords.length
        ? {
            AND: keywords.map((kw) => ({
              OR: [
                { title: { contains: kw, mode: "insensitive" } },
                { description: { contains: kw, mode: "insensitive" } },
                {
                  attributes: {
                    some: { value: { contains: kw, mode: "insensitive" } },
                  },
                },
              ],
            })),
          }
        : {}),
    };

    if (useDistance) {
      // Fetch a wider set, filter by haversine, then page in memory
      const rows = await prisma.listing.findMany({
        where,
        orderBy: buildOrderBy(filters.sort === "distance" ? "relevance" : filters.sort),
        take: 400,
        select: {
          id: true,
          title: true,
          slug: true,
          priceInr: true,
          conditionGrade: true,
          city: true,
          state: true,
          lat: true,
          lng: true,
          isFeatured: true,
          isBoosted: true,
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      });

      const originLat = filters.lat!;
      const originLng = filters.lng!;
      const radius = filters.radiusKm ?? 25;

      let withDistance: SearchResultItem[] = rows
        .map((row) => {
          const lat = row.lat;
          const lng = row.lng;
          const dist =
            lat != null && lng != null
              ? distanceKm(originLat, originLng, lat, lng)
              : Number.POSITIVE_INFINITY;
          return { ...row, distanceKm: Number.isFinite(dist) ? dist : undefined };
        })
        .filter((row) => (row.distanceKm ?? Infinity) <= radius);

      if (filters.sort === "distance") {
        withDistance = withDistance.sort(
          (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
        );
      }

      const total = withDistance.length;
      const items = withDistance.slice(skip, skip + pageSize);
      return { items, total, page, pageSize };
    }

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: buildOrderBy(filters.sort),
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          priceInr: true,
          conditionGrade: true,
          city: true,
          state: true,
          lat: true,
          lng: true,
          isFeatured: true,
          isBoosted: true,
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      }),
    ]);

    return {
      items: rows,
      total,
      page,
      pageSize,
    };
  }
}

export const searchService = new SearchService();
