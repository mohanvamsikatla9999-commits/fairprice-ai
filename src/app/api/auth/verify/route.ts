import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { consumeVerificationToken } from "@/lib/api/auth-helpers";
import { ValidationError } from "@/lib/api/errors";

const schema = z.object({
  token: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await jsonBody(request));
    const record = await consumeVerificationToken({
      token: body.token,
      type: "email_verify",
    });
    if (!record) throw new ValidationError("Invalid or expired verification token");

    await prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: new Date(),
        verificationLevel: "EMAIL_VERIFIED",
      },
    });

    return ok({ verified: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
