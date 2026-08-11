import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/middleware";
import { valuationEngine, valuationExplanationService } from "@/services/valuation";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";

const moneyInr = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}, z.number().int().positive().optional());

const ageMonthsSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}, z.number().int().min(0).optional());

const schema = z.object({
  categorySlug: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  productLabel: z.string().optional(),
  conditionGrade: z
    .enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .optional()
    .default("GOOD"),
  conditionScore: z.number().min(0).max(100).optional(),
  ageMonths: ageMonthsSchema,
  city: z.string().optional(),
  state: z.string().optional(),
  askingPriceInr: moneyInr,
  msrpInr: moneyInr,
  listingId: z.string().optional(),
  persist: z.boolean().optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const raw = await jsonBody(request);
    if (raw === null || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }
    const body = schema.parse(raw);
    const result = await valuationEngine.value({
      categorySlug: body.categorySlug,
      brand: body.brand,
      model: body.model,
      productLabel: body.productLabel,
      conditionGrade: body.conditionGrade,
      conditionScore: body.conditionScore,
      ageMonths:
        body.ageMonths ??
        (typeof body.attributes?.ageMonths === "number"
          ? body.attributes.ageMonths
          : undefined),
      city: body.city,
      state: body.state,
      askingPriceInr: body.askingPriceInr,
      msrpInr: body.msrpInr,
      attributes: body.attributes,
    });
    const narrative = await valuationExplanationService.explain(
      result,
      body.askingPriceInr,
    );

    let valuationId: string | undefined;
    if (body.persist !== false) {
      const saved = await prisma.valuation.create({
        data: {
          listingId: body.listingId,
          userId: user?.id,
          productLabel: result.productLabel,
          fairValueMinInr: result.fairValueMinInr,
          fairValueMaxInr: result.fairValueMaxInr,
          fairValueMidInr: result.fairValueMidInr,
          recommendedListingInr: result.recommendedListingInr,
          expectedSaleMinInr: result.expectedSaleMinInr,
          expectedSaleMaxInr: result.expectedSaleMaxInr,
          quickSaleInr: result.quickSaleInr,
          conditionScore: result.conditionScore,
          priceConfidence: result.priceConfidence,
          marketDemandScore: result.marketDemandScore,
          marketLiquidity: result.marketLiquidity,
          depreciationEstimate: result.depreciationEstimate,
          marketTrend: result.marketTrend,
          verdict: result.verdict,
          buyerVerdict: narrative.buyerVerdict,
          sellerRecommendation: narrative.sellerRecommendation,
          negotiationMinInr: result.negotiationMinInr,
          negotiationMaxInr: result.negotiationMaxInr,
          explanation: narrative.explanation,
          sellerPriceInr: body.askingPriceInr,
          factors: result.factors,
          comparableCount: result.comparableCount,
          engineVersion: result.engineVersion,
        },
      });
      valuationId = saved.id;
    }

    return ok({
      valuation: {
        ...result,
        explanation: narrative.explanation,
        buyerVerdict: narrative.buyerVerdict,
        sellerRecommendation: narrative.sellerRecommendation,
        talkingPoints: narrative.talkingPoints,
        id: valuationId,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
