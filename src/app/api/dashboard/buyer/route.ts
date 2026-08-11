import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { offersService } from "@/services/offers/service";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    const user = await requireUser();
    const [favorites, offers, alerts, recentViews] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: user.id },
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      }),
      offersService.listForUser(user.id, 50),
      prisma.priceAlert.findMany({
        where: { userId: user.id, isActive: true },
        take: 20,
      }),
      prisma.listingView.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          listing: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      }),
    ]);

    const sentOffers = offers.filter((o) => o.buyerId === user.id);

    return ok({
      stats: {
        favorites: favorites.length,
        activeOffers: sentOffers.filter((o) => o.status === "PENDING").length,
        priceAlerts: alerts.length,
      },
      favorites,
      offers: sentOffers.slice(0, 20),
      alerts,
      recentViews,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
