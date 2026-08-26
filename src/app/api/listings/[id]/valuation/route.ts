import { getCurrentUser } from "@/lib/auth/middleware";
import { listingsService } from "@/services/listings/service";
import { valuationEngine } from "@/services/valuation";
import { valuationExplanationService } from "@/services/valuation";
import { matchCatalogProduct } from "@/services/valuation/catalog";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/handler";
import { formatInr } from "@/lib/utils";
import type { ValuationResult } from "@/services/valuation/model";

type Ctx = { params: Promise<{ id: string }> };

// ── Fallback narratives (used when Gemini is unavailable) ────────────────────

function buildFallbackExplanation(
  result: ValuationResult,
  askingPriceInr: number,
  msrpInr?: number,
  conditionGrade?: string,
): string {
  const parts: string[] = [];
  if (msrpInr && msrpInr > 0) {
    const depr = Math.round((1 - result.fairValueMidInr / msrpInr) * 100);
    parts.push(
      `The original price of this product is ${formatInr(msrpInr)}. ` +
      `After use${conditionGrade ? ` in ${conditionGrade.replace(/_/g, " ").toLowerCase()} condition` : ""}, ` +
      `it has depreciated approximately ${depr}%.`,
    );
  }
  parts.push(
    `The fair second-hand value is ${formatInr(result.fairValueMinInr)}–${formatInr(result.fairValueMaxInr)} ` +
    `(mid ${formatInr(result.fairValueMidInr)}), based on ${result.comparableCount} comparable listings.`,
  );
  const verdict = result.verdict.replace(/_/g, " ").toLowerCase();
  parts.push(`The asking price of ${formatInr(askingPriceInr)} is ${verdict} vs the fair range.`);
  return parts.join(" ");
}

function buildFallbackBuyerVerdict(result: ValuationResult, askingPriceInr: number): string {
  if (result.verdict === "UNDERPRICED") {
    return `This is priced below fair market value — a good buy if condition checks out in person.`;
  }
  if (result.verdict === "FAIR") {
    return `This is fairly priced. Try negotiating to ${formatInr(result.fairValueMinInr)} and inspect in person.`;
  }
  if (result.verdict === "SLIGHTLY_HIGH") {
    return `Slightly above fair range. Counter-offer at ${formatInr(result.fairValueMidInr)} using comparable market data.`;
  }
  return `This is overpriced vs. market. Counter at ${formatInr(result.fairValueMidInr)} and show the seller this FairPrice report.`;
}

function buildFallbackTalkingPoints(result: ValuationResult, msrpInr?: number): string[] {
  const points: string[] = [];
  if (msrpInr && msrpInr > 0) {
    const depr = Math.round((1 - result.fairValueMidInr / msrpInr) * 100);
    points.push(`Original price was ${formatInr(msrpInr)} — fair used value is ${formatInr(result.fairValueMidInr)}, that's ${depr}% off new.`);
  }
  points.push(`Fair market range is ${formatInr(result.fairValueMinInr)}–${formatInr(result.fairValueMaxInr)} based on real listings.`);
  points.push(`A reasonable offer is ${formatInr(result.negotiationMinInr)}–${formatInr(result.negotiationMaxInr)}.`);
  if (result.comparableCount > 0) {
    points.push(`Price backed by ${result.comparableCount} comparable listings in the current market.`);
  }
  points.push(`Quick-sale value is ${formatInr(result.quickSaleInr)} — use this as your walk-away price.`);
  for (const f of result.factors.slice(0, 1)) {
    if (f.description) points.push(f.description);
  }
  return points.slice(0, 5);
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function POST(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const listing = await listingsService.getById(id);

    // Resolve MRP from catalog if not stored on listing
    let msrpInr = listing.originalPriceInr ?? undefined;
    if (!msrpInr) {
      const catalogHit = matchCatalogProduct(listing.title);
      if (catalogHit?.msrpInr) msrpInr = catalogHit.msrpInr;
    }

    // Extract age from listing attributes
    const attrs = listing.attributes as Array<{ key: string; value: string }> | undefined;
    const ageAttr = attrs?.find((a) => a.key === "age_months" || a.key === "ageMonths");
    const ageMonths = ageAttr ? Number(ageAttr.value) : undefined;

    const result = await valuationEngine.value({
      categorySlug: listing.category.slug,
      productLabel: listing.title,
      conditionGrade: listing.conditionGrade,
      conditionScore: listing.condition?.score,
      city: listing.city ?? undefined,
      state: listing.state ?? undefined,
      askingPriceInr: listing.priceInr,
      msrpInr,
      ageMonths,
      allowSyntheticComps: true,
      attributes: attrs
        ? Object.fromEntries(attrs.map((a) => [a.key, a.value]))
        : undefined,
    });

    // Build fallback narrative first — Gemini may fail or be slow
    let narrative = {
      explanation: buildFallbackExplanation(result, listing.priceInr, msrpInr, listing.conditionGrade),
      buyerVerdict: buildFallbackBuyerVerdict(result, listing.priceInr),
      sellerRecommendation: `List at ${formatInr(result.recommendedListingInr)} for the best response within 1–2 weeks. Quick sale at ${formatInr(result.quickSaleInr)}.`,
      talkingPoints: buildFallbackTalkingPoints(result, msrpInr),
    };

    // Try Gemini — if it fails, the fallback above is used
    try {
      const geminiNarrative = await valuationExplanationService.explain(
        result,
        listing.priceInr,
        {
          msrpInr: msrpInr ?? null,
          conditionGrade: listing.conditionGrade,
          ageMonths,
          city: listing.city ?? undefined,
        },
      );
      narrative = geminiNarrative;
    } catch {
      // Gemini unavailable — fallback narrative already set
    }

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
        factors: result.factors,
        depreciationEstimate: result.depreciationEstimate,
        marketTrend: result.marketTrend,
        comparableCount: result.comparableCount,
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
