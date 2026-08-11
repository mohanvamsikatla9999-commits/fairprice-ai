import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
