import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireCurrentPermission("admin:market-data");
    const comparables = await prisma.comparableListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return ok({ comparables });
  } catch (error) {
    return handleRouteError(error);
  }
}
