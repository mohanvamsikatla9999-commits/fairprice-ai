import { fairPriceService, fairPriceInputSchema } from "@/services/fairprice";
import { getCurrentUser } from "@/lib/auth/middleware";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { checkRateLimit } from "@/lib/security/rate-limit";

/**
 * Canonical FairPrice intelligence endpoint.
 * Deterministic valuation + evidence; LLM explains only.
 *
 * HTTP semantics:
 * - SUCCESS → 200
 * - INSUFFICIENT_DATA / IDENTITY_* / UNSUPPORTED → 200 with status + null valuation
 * - validation → 400
 * - rate limit → 429
 * - ERROR → 500
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const limited = checkRateLimit({
      key: `fairprice:${user?.id ?? ip}`,
      max: 20,
      windowMs: 60_000,
    });
    if (!limited.allowed) {
      return fail("Too many valuation requests. Try again shortly.", 429, "RATE_LIMITED");
    }

    const raw = await jsonBody(request);
    if (raw === null || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }

    const input = fairPriceInputSchema.parse(raw);
    const result = await fairPriceService.evaluate(input);

    if (result.status === "ERROR") {
      return fail(result.message ?? "Valuation error", 500, "FAIRPRICE_ERROR", {
        fairPrice: result,
      });
    }

    // Non-success valuation states still return 200 with explicit status + null valuation
    // so clients can render questions / conflict UI without treating it as a fake price.
    return ok({ fairPrice: result }, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
