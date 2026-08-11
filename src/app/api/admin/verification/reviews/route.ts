import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireCurrentPermission("verification:review");
    const cases = await prisma.verificationReviewCase.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true, trustScore: true } },
        verification: {
          select: {
            id: true,
            status: true,
            isDevelopment: true,
            riskClass: true,
            failureReasonCode: true,
            provider: true,
          },
        },
      },
    });
    return ok({ cases });
  } catch (error) {
    return handleRouteError(error);
  }
}
