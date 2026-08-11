import { createHash } from "crypto";
import { handleRouteError } from "@/lib/api/handler";
import { ok, fail } from "@/lib/api/response";
import { env } from "@/config/env";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { identityVerificationService } from "@/services/verification";

/**
 * Provider webhooks — signature required. Never trust client-set userId/status.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Accept mock signature OR HMAC-style shared secret header
    const sig =
      headers["x-fairprice-idv-signature"] ??
      headers["x-idv-signature"] ??
      "";
    const expectedMock = createHash("sha256").update(`${rawBody}.mock`).digest("hex");
    const expectedProd = createHash("sha256")
      .update(`${rawBody}.${env.IDENTITY_WEBHOOK_SECRET}`)
      .digest("hex");

    if (sig !== expectedMock && sig !== expectedProd) {
      await prisma.verificationEvent.create({
        data: {
          eventType: "provider_webhook_rejected",
          payload: { reason: "bad_signature" } as Prisma.InputJsonValue,
          signatureValid: false,
        },
      });
      return fail("Invalid webhook signature", 401, "WEBHOOK_INVALID");
    }

    // Normalize to mock-compatible signature for provider handler when prod secret used
    if (sig === expectedProd && sig !== expectedMock) {
      headers["x-fairprice-idv-signature"] = expectedMock;
    }

    const result = await identityVerificationService.handleWebhook(rawBody, headers);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
