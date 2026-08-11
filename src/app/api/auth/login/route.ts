import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { UnauthorizedError, ValidationError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `auth:login:${request.headers.get("x-forwarded-for") ?? "local"}`,
      max: 20,
    });
    const body = schema.parse(await jsonBody(request));

    const user = await prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });
    if (!user?.passwordHash) throw new UnauthorizedError("Invalid email or password");
    if (user.isBlocked) throw new UnauthorizedError("Account is blocked");

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get("x-forwarded-for") ?? undefined,
        loginCount: { increment: 1 },
      },
    });

    const session = await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      requireSigninFace: true,
    });

    return ok({
      requiresFaceVerification: session.requiresSigninFace,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        onboardingDone: user.onboardingDone,
        verificationLevel: user.verificationLevel,
        trustScore: user.trustScore,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) return handleRouteError(error);
    return handleRouteError(error);
  }
}
