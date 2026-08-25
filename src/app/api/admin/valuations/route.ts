import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireCurrentPermission("admin:valuations");
    const valuations = await prisma.valuation.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    return ok({ valuations });
  } catch (error) {
    return handleRouteError(error);
  }
}
