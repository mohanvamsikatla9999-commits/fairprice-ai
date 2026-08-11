import { searchService } from "@/services/search/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await searchService.search({
      query: searchParams.get("q") ?? undefined,
      categorySlug: searchParams.get("category") ?? undefined,
      minPriceInr: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPriceInr: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      city: searchParams.get("city") ?? undefined,
      state: searchParams.get("state") ?? undefined,
      lat: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
      lng: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
      radiusKm: searchParams.get("radiusKm")
        ? Number(searchParams.get("radiusKm"))
        : undefined,
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
        | null) ?? "relevance",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize")
        ? Number(searchParams.get("pageSize"))
        : 24,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
