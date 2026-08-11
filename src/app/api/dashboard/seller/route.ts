import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { listingsService } from "@/services/listings/service";
import { offersService } from "@/services/offers/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    const user = await requireUser();
    const [listings, offers, viewsAgg, favoritesAgg] = await Promise.all([
      listingsService.listBySeller(user.id, 100),
      offersService.listForUser(user.id, 100),
      prisma.listing.aggregate({
        where: { sellerId: user.id, deletedAt: null },
        _sum: { views: true, favoriteCount: true },
      }),
      prisma.favorite.count({
        where: { listing: { sellerId: user.id } },
      }),
    ]);

    const receivedOffers = offers.filter((o) => o.sellerId === user.id);
    const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
    const draftListings = listings.filter((l) => l.status === "DRAFT").length;
    const soldListings = listings.filter((l) => l.status === "SOLD").length;

    return ok({
      stats: {
        activeListings,
        draftListings,
        soldListings,
        totalViews: viewsAgg._sum.views ?? 0,
        totalFavorites: favoritesAgg || (viewsAgg._sum.favoriteCount ?? 0),
        pendingOffers: receivedOffers.filter((o) => o.status === "PENDING").length,
      },
      listings: listings.slice(0, 20),
      offers: receivedOffers.slice(0, 20),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
