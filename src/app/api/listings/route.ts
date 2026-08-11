import { z } from "zod";
import { requireUser, getCurrentUser } from "@/lib/auth/middleware";
import { listingsService } from "@/services/listings/service";
import { searchService } from "@/services/search/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { UnauthorizedError } from "@/lib/api/errors";

const createSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(8000),
  priceInr: z.number().int().positive(),
  conditionGrade: z
    .enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  area: z.string().optional(),
  postalCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sellerType: z.enum(["INDIVIDUAL", "BUSINESS"]).optional(),
  originalPriceInr: z.number().int().positive().optional(),
  attributes: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
  images: z
    .array(
      z.object({
        storageKey: z.string(),
        url: z.string(),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().optional(),
      }),
    )
    .optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";
    const user = await getCurrentUser();

    if (mine) {
      if (!user) throw new UnauthorizedError();
      const items = await listingsService.listBySeller(user.id);
      return ok({ items });
    }

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
        | null) ?? "newest",
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

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await jsonBody(request));
    const listing = await listingsService.create({
      ...body,
      sellerId: user.id,
    });
    return ok({ listing }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
