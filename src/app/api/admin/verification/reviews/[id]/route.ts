import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "ESCALATED"]),
  notes: z.string().max(2000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const admin = await requireCurrentPermission("verification:review");
    const { id } = await ctx.params;
    const body = schema.parse(await jsonBody(request));
    await identityVerificationService.adminDecideReview({
      reviewId: id,
      actorId: admin.id,
      decision: body.decision,
      notes: body.notes,
    });
    return ok({ reviewed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
