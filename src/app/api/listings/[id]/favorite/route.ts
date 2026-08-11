import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { listingsService } from "@/services/listings/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await listingsService.getById(id);

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await prisma.listing.update({
        where: { id },
        data: { favoriteCount: { decrement: 1 } },
      });
      return ok({ favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: user.id, listingId: id },
    });
    await prisma.listing.update({
      where: { id },
      data: { favoriteCount: { increment: 1 } },
    });
    return ok({ favorited: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const favorite = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: id } },
    });
    return ok({ favorited: Boolean(favorite) });
  } catch (error) {
    return handleRouteError(error);
  }
}
