import { prisma } from "@/lib/db";

export type RecommendationResult = {
  listingId: string;
  score: number;
  reason: string;
};

export class RecommendationEngine {
  async forUser(userId: string, take = 12): Promise<RecommendationResult[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredCategories: true,
        interests: true,
        favorites: { select: { listingId: true, listing: { select: { categoryId: true } } }, take: 20 },
        viewHistory: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { listing: { select: { id: true, categoryId: true, priceInr: true } } },
        },
      },
    });

    const excludeIds = new Set<string>([
      ...(user?.favorites.map((f) => f.listingId) ?? []),
      ...(user?.viewHistory.map((v) => v.listing.id) ?? []),
    ]);

    const preferredCategoryIds = [
      ...new Set([
        ...(user?.favorites.map((f) => f.listing.categoryId) ?? []),
        ...(user?.viewHistory.map((v) => v.listing.categoryId) ?? []),
      ]),
    ];

    const recentPrices = user?.viewHistory.map((v) => v.listing.priceInr) ?? [];
    const avgPrice =
      recentPrices.length > 0
        ? recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
        : undefined;

    const candidates = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        id: excludeIds.size ? { notIn: [...excludeIds] } : undefined,
        OR: [
          preferredCategoryIds.length
            ? { categoryId: { in: preferredCategoryIds } }
            : undefined,
          user?.preferredCategories?.length
            ? { category: { slug: { in: user.preferredCategories } } }
            : undefined,
          { isFeatured: true },
          { isAiVerified: true },
        ].filter(Boolean) as object[],
      },
      take: take * 4,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      include: { category: true },
    });

    const scored = candidates.map((listing) => {
      let score = 0.2;
      const reasons: string[] = [];

      if (preferredCategoryIds.includes(listing.categoryId)) {
        score += 0.35;
        reasons.push("Similar to items you viewed");
      }
      if (user?.preferredCategories?.includes(listing.category.slug)) {
        score += 0.2;
        reasons.push("Matches your preferred categories");
      }
      if (listing.isFeatured) {
        score += 0.1;
        reasons.push("Featured listing");
      }
      if (listing.isAiVerified) {
        score += 0.08;
        reasons.push("AI verified");
      }
      if (avgPrice) {
        const delta = Math.abs(listing.priceInr - avgPrice) / avgPrice;
        if (delta < 0.35) {
          score += 0.15;
          reasons.push("In your usual price range");
        }
      }
      if (user?.interests?.some((i) => listing.title.toLowerCase().includes(i.toLowerCase()))) {
        score += 0.12;
        reasons.push("Matches your interests");
      }

      return {
        listingId: listing.id,
        score: Math.min(1, score),
        reason: reasons[0] ?? "Popular near you",
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, take);
  }

  async similarToListing(listingId: string, take = 8): Promise<RecommendationResult[]> {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
    });
    if (!listing) return [];

    const similar = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        id: { not: listingId },
        categoryId: listing.categoryId,
        priceInr: {
          gte: Math.round(listing.priceInr * 0.7),
          lte: Math.round(listing.priceInr * 1.3),
        },
      },
      take,
      orderBy: { publishedAt: "desc" },
    });

    return similar.map((s) => ({
      listingId: s.id,
      score: 0.7,
      reason: "Similar category and price",
    }));
  }
}

export const recommendationEngine = new RecommendationEngine();
