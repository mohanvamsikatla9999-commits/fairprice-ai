import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { AppError } from "@/lib/api/errors";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/config/env";
import { identityVerificationService } from "@/services/verification";
import { verificationAttemptLimitService } from "@/services/verification/attempt-limits";

const schema = z.object({
  completedChallenges: z.array(z.string()).default([]),
  hints: z
    .object({
      faceCount: z.number().int().min(0).max(10).optional(),
      faceLostCount: z.number().int().min(0).max(50).optional(),
      frameJitter: z.number().min(0).max(1).optional(),
      screenMoiréHint: z.boolean().optional(),
      cameraPermission: z.enum(["granted", "denied", "unavailable"]).optional(),
      captureDurationMs: z.number().int().min(0).max(120_000).optional(),
      automationHint: z.boolean().optional(),
      lowLight: z.boolean().optional(),
    })
    .default({}),
  forceOutcome: z.enum(["success", "fail", "review", "spoof"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const raw = (await jsonBody(request)) as Record<string, unknown>;
    await verificationAttemptLimitService.assertNotManipulatingClientStatus(raw ?? {});

    if (raw && ("image" in raw || "selfie" in raw || "frame" in raw || "biometric" in raw)) {
      throw new AppError(
        "Biometric payloads are not accepted by this API",
        400,
        "BIOMETRIC_REJECTED",
      );
    }

    const body = schema.parse(raw);

    const forceOutcome =
      env.MOCK_IDENTITY_VERIFICATION && env.NODE_ENV !== "production"
        ? body.forceOutcome
        : undefined;

    const result = await identityVerificationService.submitLiveness({
      userId: user.id,
      verificationId: id,
      completedChallenges: body.completedChallenges,
      hints: body.hints,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      forceOutcome,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
