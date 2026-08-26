import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

const querySchema = z.object({
  city: z.string().optional(),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      city: url.searchParams.get("city") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        ...(parsed.city
          ? { city: { equals: parsed.city, mode: "insensitive" } }
          : {}),
        ...(parsed.q
          ? {
              OR: [
                { city: { contains: parsed.q, mode: "insensitive" } },
                { area: { contains: parsed.q, mode: "insensitive" } },
                { state: { contains: parsed.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ city: "asc" }, { area: "asc" }],
      take: 200,
    });

    return ok({ locations });
  } catch (error) {
    return handleRouteError(error);
  }
}
