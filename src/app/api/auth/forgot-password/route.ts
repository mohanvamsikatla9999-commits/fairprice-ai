import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import {
  appUrl,
  createVerificationToken,
  sendAuthEmail,
} from "@/lib/api/auth-helpers";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({ key: `auth:forgot:${request.headers.get("x-forwarded-for") ?? "local"}`, max: 5 });
    const body = schema.parse(await jsonBody(request));

    const user = await prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    // Always succeed to avoid account enumeration
    if (user) {
      const token = await createVerificationToken({
        userId: user.id,
        type: "password_reset",
        hoursValid: 2,
      });
      const link = appUrl(`/reset-password?token=${token}`);
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your FairPrice AI password",
        text: `Reset your password: ${link}`,
        html: `<p>Reset your password:</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 2 hours.</p>`,
      });
    }

    return ok({ sent: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
