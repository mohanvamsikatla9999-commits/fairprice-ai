import { z } from "zod";
import { requireUser, getCurrentUser } from "@/lib/auth/middleware";
import { listingsService } from "@/services/listings/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const updateSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(10).max(8000).optional(),
  priceInr: z.number().int().positive().optional(),
  conditionGrade: z
    .enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .optional(),
  productId: z.string().nullable().optional(),
  variantId: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  originalPriceInr: z.number().int().positive().nullable().optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING_REVIEW",
      "ACTIVE",
      "PAUSED",
      "SOLD",
      "EXPIRED",
      "REJECTED",
      "DELETED",
    ])
    .optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const listing = await listingsService.getById(id);
    const user = await getCurrentUser();
    if (!user || user.id !== listing.sellerId) {
      await listingsService.incrementViews(id, true).catch(() => undefined);
    }
    return ok({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = updateSchema.parse(await jsonBody(request));
    const listing = await listingsService.update(id, user.id, {
      ...body,
      productId: body.productId ?? undefined,
      variantId: body.variantId ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      postalCode: body.postalCode ?? undefined,
      originalPriceInr: body.originalPriceInr ?? undefined,
    });
    return ok({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const listing = await listingsService.softDelete(id, user.id);
    return ok({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}
