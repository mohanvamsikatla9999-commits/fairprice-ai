import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

export async function GET(request: Request) {
  try {
    await requireCurrentPermission("moderation:access");
    const status = new URL(request.url).searchParams.get("status");
    const reports = await prisma.report.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { id: true, email: true, name: true } },
        targetUser: { select: { id: true, email: true, name: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
    });
    return ok({ reports });
  } catch (error) {
    return handleRouteError(error);
  }
}

const patchSchema = z.object({
  reportId: z.string(),
  status: z.enum([
    "OPEN",
    "UNDER_REVIEW",
    "ACTION_TAKEN",
    "DISMISSED",
    "ESCALATED",
  ]),
  resolution: z.string().max(2000).optional(),
});

export async function PATCH(request: Request) {
  try {
    const admin = await requireCurrentPermission("moderation:access");
    const body = patchSchema.parse(await jsonBody(request));
    const report = await prisma.report.update({
      where: { id: body.reportId },
      data: {
        status: body.status,
        resolution: body.resolution,
        resolvedBy: admin.id,
        resolvedAt: ["ACTION_TAKEN", "DISMISSED"].includes(body.status)
          ? new Date()
          : undefined,
      },
    });
    return ok({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
