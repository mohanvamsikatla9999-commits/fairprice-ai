import { searchService } from "@/services/search/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attributes: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("attr_")) {
        attributes[key.slice(5)] = value;
      }
    }

    const query = searchParams.get("q") ?? undefined;
    const result = await searchService.search({
      query,
      categorySlug: searchParams.get("category") ?? undefined,
      minPriceInr: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPriceInr: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      city: searchParams.get("city") ?? undefined,
      state: searchParams.get("state") ?? undefined,
      area: searchParams.get("area") ?? undefined,
      lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
      lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
      radiusKm: searchParams.get("radiusKm")
        ? Number(searchParams.get("radiusKm"))
        : undefined,
      sellerType: (searchParams.get("sellerType") as
        | "INDIVIDUAL"
        | "BUSINESS"
        | null) ?? undefined,
      postedWithinDays: searchParams.get("postedWithin")
        ? Number(searchParams.get("postedWithin"))
        : undefined,
      attributes,
      conditionGrade: (searchParams.get("condition") as
        | "LIKE_NEW"
        | "EXCELLENT"
        | "GOOD"
        | "FAIR"
        | "POOR"
        | null) ?? undefined,
      sort: (searchParams.get("sort") as
        | "relevance"
        | "price_asc"
        | "price_desc"
        | "newest"
        | "distance"
        | "views"
        | "featured"
        | null) ?? "relevance",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : 24,
    });

    const user = await getCurrentUser();
    if (user && query?.trim()) {
      await prisma.searchHistory.create({
        data: {
          userId: user.id,
          query: query.trim().slice(0, 200),
          filters: {
            category: searchParams.get("category"),
            city: searchParams.get("city"),
          },
        },
      });
      const old = await prisma.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: 30,
        select: { id: true },
      });
      if (old.length) {
        await prisma.searchHistory.deleteMany({
          where: { id: { in: old.map((o) => o.id) } },
        });
      }
    }

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
