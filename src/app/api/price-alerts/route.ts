import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const schema = z.object({
  listingId: z.string().optional(),
  categorySlug: z.string().optional(),
  productQuery: z.string().optional(),
  targetPriceInr: z.number().int().positive().optional(),
  maxPriceInr: z.number().int().positive().optional(),
  minCondition: z
    .enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .optional(),
  city: z.string().optional(),
  notifyOnDrop: z.boolean().optional(),
  notifyOnNew: z.boolean().optional(),
  notifyOnFair: z.boolean().optional(),
  notifyOnUnder: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.priceAlert.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await jsonBody(request));
    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        ...body,
      },
    });
    return ok({ alert }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      const { ValidationError } = await import("@/lib/api/errors");
      throw new ValidationError("id required");
    }
    await prisma.priceAlert.updateMany({
      where: { id, userId: user.id },
      data: { isActive: false },
    });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
