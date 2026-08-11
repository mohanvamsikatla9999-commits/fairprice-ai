import { getCurrentUser } from "@/lib/auth/middleware";
import { listingsService } from "@/services/listings/service";
import { valuationEngine } from "@/services/valuation";
import { valuationExplanationService } from "@/services/valuation";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const listing = await listingsService.getById(id);

    const result = await valuationEngine.value({
      categorySlug: listing.category.slug,
      productLabel: listing.title,
      conditionGrade: listing.conditionGrade,
      conditionScore: listing.condition?.score,
      city: listing.city ?? undefined,
      state: listing.state ?? undefined,
      askingPriceInr: listing.priceInr,
      msrpInr: listing.originalPriceInr ?? undefined,
    });

    const narrative = await valuationExplanationService.explain(
      result,
      listing.priceInr,
    );

    const saved = await prisma.valuation.create({
      data: {
        listingId: listing.id,
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
        sellerPriceInr: listing.priceInr,
        factors: result.factors,
        comparableCount: result.comparableCount,
        engineVersion: result.engineVersion,
        factorRows: {
          create: result.factors.map((f) => ({
            name: f.name,
            impactInr: f.impactInr,
            impactPct: f.impactPct,
            description: f.description,
          })),
        },
      },
    });

    return ok({
      valuation: {
        ...result,
        explanation: narrative.explanation,
        buyerVerdict: narrative.buyerVerdict,
        sellerRecommendation: narrative.sellerRecommendation,
        talkingPoints: narrative.talkingPoints,
        id: saved.id,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const valuation = await prisma.valuation.findFirst({
      where: { listingId: id },
      orderBy: { createdAt: "desc" },
      include: { factorRows: true },
    });
    return ok({ valuation });
  } catch (error) {
    return handleRouteError(error);
  }
}
