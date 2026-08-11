import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { markSigninFaceVerified } from "@/lib/auth/session";
import { AppError } from "@/lib/api/errors";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/config/env";
import { identityVerificationService } from "@/services/verification";
import { verificationAttemptLimitService } from "@/services/verification/attempt-limits";

const schema = z.object({
  verificationId: z.string().min(1),
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
});

/** Complete auth face+liveness and unlock the session. */
export async function POST(request: Request) {
  try {
    const user = await requireUser({ allowPendingFace: true });
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

    const result = await identityVerificationService.submitLiveness({
      userId: user.id,
      verificationId: body.verificationId,
      completedChallenges: body.completedChallenges,
      hints: body.hints,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      forceOutcome:
        env.MOCK_IDENTITY_VERIFICATION && env.NODE_ENV !== "production"
          ? "success"
          : undefined,
    });

    if (result.verification.status === "VERIFIED") {
      await markSigninFaceVerified(user.session.sid);
      return ok({
        verified: true,
        verification: result.verification,
      });
    }

    return ok({
      verified: false,
      verification: result.verification,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
