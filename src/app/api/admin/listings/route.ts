import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

export async function GET(request: Request) {
  try {
    await requireCurrentPermission("listing:moderate");
    const status = new URL(request.url).searchParams.get("status");
    const listings = await prisma.listing.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        seller: {
          select: { id: true, email: true, name: true, trustScore: true },
        },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
    return ok({ listings });
  } catch (error) {
    return handleRouteError(error);
  }
}

const patchSchema = z.object({
  listingId: z.string(),
  status: z.enum([
    "DRAFT",
    "PENDING_REVIEW",
    "ACTIVE",
    "PAUSED",
    "SOLD",
    "EXPIRED",
    "REJECTED",
    "DELETED",
  ]),
});

export async function PATCH(request: Request) {
  try {
    await requireCurrentPermission("listing:moderate");
    const body = patchSchema.parse(await jsonBody(request));
    const listing = await prisma.listing.update({
      where: { id: body.listingId },
      data: {
        status: body.status,
        ...(body.status === "ACTIVE" ? { publishedAt: new Date() } : {}),
        ...(body.status === "DELETED" ? { deletedAt: new Date() } : {}),
      },
    });
    return ok({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}
