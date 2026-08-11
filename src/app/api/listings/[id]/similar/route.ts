import { recommendationEngine } from "@/services/recommendations/engine";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const recs = await recommendationEngine.similarToListing(id, 8);
    const ids = recs.map((r) => r.listingId);
    const listings = await prisma.listing.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: true,
      },
    });
    const byId = new Map(listings.map((l) => [l.id, l]));
    const items = recs
      .map((r) => {
        const l = byId.get(r.listingId);
        if (!l) return null;
        return {
          id: l.id,
          title: l.title,
          priceInr: l.priceInr,
          city: l.city,
          imageUrl: l.images[0]?.url ?? null,
          reason: r.reason,
        };
      })
      .filter(Boolean);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
