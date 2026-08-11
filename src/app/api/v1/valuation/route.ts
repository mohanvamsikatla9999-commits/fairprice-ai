import { z } from "zod";
import { valuationEngine, valuationExplanationService } from "@/services/valuation";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { hashApiKey } from "@/lib/api/auth-helpers";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  categorySlug: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  productLabel: z.string().optional(),
  conditionGrade: z.enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"]),
  conditionScore: z.number().min(0).max(100).optional(),
  ageMonths: z.number().int().min(0).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  askingPriceInr: z.number().int().positive().optional(),
  msrpInr: z.number().int().positive().optional(),
});

async function authenticateApiKey(request: Request) {
  const header =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header) return null;

  const keyHash = hashApiKey(header);
  const apiKey = await prisma.aPIKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { user: { select: { id: true, role: true, isBlocked: true } } },
  });
  if (!apiKey || apiKey.user.isBlocked) return null;
  return apiKey;
}

export async function POST(request: Request) {
  const started = Date.now();
  let apiKeyId: string | undefined;
  let status = 200;
  try {
    const apiKey = await authenticateApiKey(request);
    if (!apiKey) {
      status = 401;
      return fail("Valid API key required", 401, "UNAUTHORIZED");
    }
    apiKeyId = apiKey.id;
    enforceRateLimit({ key: `v1:valuation:${apiKey.id}`, max: 60 });

    const body = schema.parse(await jsonBody(request));
    const result = await valuationEngine.value(body);
    const narrative = await valuationExplanationService.explain(
      result,
      body.askingPriceInr,
    );

    await prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return ok({
      valuation: {
        ...result,
        explanation: narrative.explanation,
        buyerVerdict: narrative.buyerVerdict,
        sellerRecommendation: narrative.sellerRecommendation,
      },
    });
  } catch (error) {
    status = 400;
    return handleRouteError(error);
  } finally {
    if (apiKeyId) {
      await prisma.aPIUsage
        .create({
          data: {
            apiKeyId,
            endpoint: "/api/v1/valuation",
            status,
            latencyMs: Date.now() - started,
          },
        })
        .catch(() => undefined);
    }
  }
}
