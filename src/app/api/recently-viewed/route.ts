import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { getCurrentUser, requireUser } from "@/lib/auth/middleware";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ items: [] });

    const items = await prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: "desc" },
      take: 20,
      include: {
        listing: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return ok({
      items: items
        .filter((i) => i.listing.status === "ACTIVE" && !i.listing.deletedAt)
        .map((i) => ({
          id: i.listing.id,
          title: i.listing.title,
          priceInr: i.listing.priceInr,
          city: i.listing.city,
          imageUrl: i.listing.images[0]?.url ?? "/placeholders/product.svg",
          viewedAt: i.viewedAt,
        })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

const postSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = postSchema.parse(await jsonBody(request));

    await prisma.recentlyViewed.upsert({
      where: {
        userId_listingId: { userId: user.id, listingId: body.listingId },
      },
      create: { userId: user.id, listingId: body.listingId },
      update: { viewedAt: new Date() },
    });

    const excess = await prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: "desc" },
      skip: 40,
      select: { id: true },
    });
    if (excess.length) {
      await prisma.recentlyViewed.deleteMany({
        where: { id: { in: excess.map((e) => e.id) } },
      });
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
