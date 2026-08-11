import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { consumeVerificationToken } from "@/lib/api/auth-helpers";
import { ValidationError } from "@/lib/api/errors";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await jsonBody(request));
    const record = await consumeVerificationToken({
      token: body.token,
      type: "password_reset",
    });
    if (!record) throw new ValidationError("Invalid or expired reset token");

    const passwordHash = await hashPassword(body.password);
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await revokeAllUserSessions(record.userId);

    return ok({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
