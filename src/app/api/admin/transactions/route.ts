import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireCurrentPermission("admin:transactions");
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        listing: { select: { id: true, title: true, priceInr: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });
    return ok({ transactions });
  } catch (error) {
    return handleRouteError(error);
  }
}
