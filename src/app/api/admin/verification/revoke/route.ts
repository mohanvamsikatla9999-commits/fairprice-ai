import { z } from "zod";
import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

const schema = z.object({
  userId: z.string().min(1),
  verificationId: z.string().optional(),
  reason: z.string().min(5).max(500),
});

export async function POST(request: Request) {
  try {
    const admin = await requireCurrentPermission("verification:review");
    const body = schema.parse(await jsonBody(request));
    await identityVerificationService.revoke({
      userId: body.userId,
      actorId: admin.id,
      reason: body.reason,
      verificationId: body.verificationId,
    });
    return ok({ revoked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
