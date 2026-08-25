import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireCurrentPermission("admin:market-data");
    const snapshots = await prisma.marketPriceSnapshot.findMany({
      orderBy: { capturedAt: "desc" },
      take: 200,
      include: {
        product: { select: { brand: true, name: true } },
      },
    });
    return ok({ snapshots });
  } catch (error) {
    return handleRouteError(error);
  }
}
