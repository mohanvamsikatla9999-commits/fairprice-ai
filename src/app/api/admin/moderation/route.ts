import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { moderationService } from "@/services/moderation/service";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

export async function GET(request: Request) {
  try {
    await requireCurrentPermission("moderation:access");
    const { searchParams } = new URL(request.url);
    const queue = await moderationService.listQueue({
      status: (searchParams.get("status") as never) ?? "PENDING",
      riskLevel: (searchParams.get("riskLevel") as never) ?? undefined,
    });
    return ok({ items: queue });
  } catch (error) {
    return handleRouteError(error);
  }
}

const decideSchema = z.object({
  caseId: z.string(),
  decision: z.enum(["ALLOW", "REVIEW", "BLOCK"]),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireCurrentPermission("moderation:access");
    const body = decideSchema.parse(await jsonBody(request));
    const result = await moderationService.decide({
      caseId: body.caseId,
      assigneeId: admin.id,
      decision: body.decision,
      notes: body.notes,
    });
    return ok({ case: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
