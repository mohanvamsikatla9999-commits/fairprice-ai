import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { identityVerificationService } from "@/services/verification";

const schema = z.object({
  accepted: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await jsonBody(request));
    void body;
    const consent = await identityVerificationService.recordConsent({
      userId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return ok({
      consentId: consent.id,
      version: consent.version,
      consentedAt: consent.consentedAt.toISOString(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
