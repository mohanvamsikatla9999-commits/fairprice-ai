import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import {
  appUrl,
  createVerificationToken,
  sendAuthEmail,
} from "@/lib/api/auth-helpers";
import { ValidationError } from "@/lib/api/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({ key: `auth:register:${request.headers.get("x-forwarded-for") ?? "local"}`, max: 10 });
    const body = schema.parse(await jsonBody(request));

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ValidationError("Email is already registered");

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        displayName: body.name,
        phone: body.phone,
        profile: { create: {} },
      },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        onboardingDone: true,
      },
    });

    const token = await createVerificationToken({
      userId: user.id,
      type: "email_verify",
      hoursValid: 48,
    });
    const verifyLink = appUrl(`/verify?token=${token}`);
    await sendAuthEmail({
      to: user.email,
      subject: "Verify your FairPrice AI account",
      text: `Verify your email: ${verifyLink}`,
      html: `<p>Welcome to FairPrice AI.</p><p><a href="${verifyLink}">Verify your email</a></p>`,
    });

    const session = await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      requireSigninFace: true, // Always require face verification for new registrations
    });

    return ok(
      {
        requiresFaceVerification: session.requiresSigninFace,
        user,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
