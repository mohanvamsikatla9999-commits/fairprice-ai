import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

const schema = z.object({
  reason: z.string().min(10).max(500),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = schema.parse(await jsonBody(request));
    const review = await identityVerificationService.requestReview({
      userId: user.id,
      verificationId: id,
      reason: body.reason,
    });
    return ok({
      reviewId: review.id,
      status: review.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
