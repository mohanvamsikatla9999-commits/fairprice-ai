import { requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

export async function GET() {
  try {
    await requireCurrentPermission("admin:access");
    const [
      users,
      listings,
      activeListings,
      openReports,
      pendingModeration,
      offers,
      valuations,
      fraudHigh,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.listing.count({ where: { deletedAt: null } }),
      prisma.listing.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.moderationCase.count({ where: { status: "PENDING" } }),
      prisma.offer.count(),
      prisma.valuation.count(),
      prisma.fraudRisk.count({
        where: { level: { in: ["HIGH", "CRITICAL"] } },
      }),
    ]);

    return ok({
      stats: {
        users,
        listings,
        activeListings,
        openReports,
        pendingModeration,
        offers,
        valuations,
        fraudHigh,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
