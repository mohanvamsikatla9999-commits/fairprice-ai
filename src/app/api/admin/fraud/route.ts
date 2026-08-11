import { requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    await requireCurrentPermission("moderation:access");
    const risks = await prisma.fraudRisk.findMany({
      orderBy: [{ level: "desc" }, { score: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true, trustScore: true } },
        signals: true,
      },
    });
    return ok({ risks });
  } catch (error) {
    return handleRouteError(error);
  }
}
