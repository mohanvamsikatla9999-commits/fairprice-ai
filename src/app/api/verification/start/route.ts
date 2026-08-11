import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/config/env";
import { identityVerificationService } from "@/services/verification";
import { verificationAttemptLimitService } from "@/services/verification/attempt-limits";

const schema = z.object({
  consentId: z.string().min(1),
  // Dev-only; ignored unless mock mode
  forceOutcome: z.enum(["success", "fail", "review", "spoof"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const raw = (await jsonBody(request)) as Record<string, unknown>;
    await verificationAttemptLimitService.assertNotManipulatingClientStatus(raw ?? {});
    const body = schema.parse(raw);

    const forceOutcome =
      env.MOCK_IDENTITY_VERIFICATION && env.NODE_ENV !== "production"
        ? body.forceOutcome
        : undefined;

    const result = await identityVerificationService.startVerification({
      userId: user.id,
      consentId: body.consentId,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      forceOutcome,
    });
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
