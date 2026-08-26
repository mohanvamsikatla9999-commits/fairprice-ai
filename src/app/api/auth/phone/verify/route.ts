import { z } from "zod";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { verifyPhoneOtp } from "@/lib/auth/phone-otp";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UnauthorizedError } from "@/lib/api/errors";

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().min(4).max(8),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `auth:phone-verify:${request.headers.get("x-forwarded-for") ?? "local"}`,
      max: 15,
    });
    const body = schema.parse(await jsonBody(request));
    const verified = await verifyPhoneOtp({
      phoneRaw: body.phone,
      code: body.code,
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: verified.userId },
    });
    if (user.isBlocked) throw new UnauthorizedError("Account is blocked");

    // New users MUST complete face verification to prevent fraud.
    // Returning users who are already face-verified skip the challenge.
    const isFaceVerified = Boolean(user.faceVerifiedAt);
    const requireFace = verified.isNew || !isFaceVerified;

    const session = await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      requireSigninFace: requireFace,
    });

    return ok({
      requiresFaceVerification: session.requiresSigninFace,
      isNew: verified.isNew,
      user: {
        id: user.id,
        email: user.email,
        phone: verified.phone,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        onboardingDone: user.onboardingDone,
        verificationLevel: user.verificationLevel,
        phoneVerified: true,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
