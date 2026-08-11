import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const [searches, alerts] = await Promise.all([
      prisma.savedSearch.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.priceAlert.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return ok({ searches, alerts });
  } catch (error) {
    return handleRouteError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  query: z.string().optional(),
  city: z.string().optional(),
  categorySlug: z.string().optional(),
  maxPriceInr: z.number().int().positive().optional(),
  alert: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await jsonBody(request));
    const search = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: body.name,
        query: body.query ?? body.name,
        filters: {
          city: body.city,
          categorySlug: body.categorySlug,
          maxPriceInr: body.maxPriceInr,
        },
        alertEnabled: Boolean(body.alert),
      },
    });

    let alert = null;
    if (body.alert) {
      alert = await prisma.priceAlert.create({
        data: {
          userId: user.id,
          productQuery: body.query ?? body.name,
          maxPriceInr: body.maxPriceInr,
          city: body.city,
          categorySlug: body.categorySlug,
          isActive: true,
        },
      });
    }

    return ok({ search, alert }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
