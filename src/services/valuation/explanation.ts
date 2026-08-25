import { getAIService } from "@/lib/ai/service";
import type { ValuationResult } from "./model";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export class ValuationExplanationService {
  async explain(
    result: ValuationResult,
    askingPriceInr?: number,
    extra?: {
      msrpInr?: number | null;
      conditionGrade?: string;
      ageMonths?: number;
      city?: string;
    },
  ): Promise<{
    explanation: string;
    buyerVerdict: string;
    sellerRecommendation: string;
    talkingPoints: string[];
  }> {
    const ai = getAIService();
    try {
      const data = await ai.explainValuation({
        productLabel: result.productLabel,
        fairValueMinInr: result.fairValueMinInr,
        fairValueMaxInr: result.fairValueMaxInr,
        fairValueMidInr: result.fairValueMidInr,
        recommendedListingInr: result.recommendedListingInr,
        quickSaleInr: result.quickSaleInr,
        priceConfidence: result.priceConfidence,
        marketDemandScore: result.marketDemandScore,
        marketLiquidity: result.marketLiquidity,
        depreciationEstimate: result.depreciationEstimate,
        marketTrend: result.marketTrend,
        verdict: result.verdict,
        factors: result.factors,
        comparableCount: result.comparableCount,
        askingPriceInr,
        // Rich context for original price → depreciation → second-hand breakdown
        msrpInr: extra?.msrpInr ?? null,
        conditionGrade: extra?.conditionGrade,
        ageMonths: extra?.ageMonths,
        city: extra?.city,
      });

      return {
        explanation: data.explanation,
        buyerVerdict: data.buyerVerdict ?? this.defaultBuyerVerdict(result, askingPriceInr),
        sellerRecommendation:
          data.sellerRecommendation ?? this.defaultSellerRecommendation(result),
        talkingPoints: data.talkingPoints ?? this.defaultTalkingPoints(result, extra?.msrpInr),
      };
    } catch {
      return {
        explanation: this.defaultExplanation(result, askingPriceInr, extra),
        buyerVerdict: this.defaultBuyerVerdict(result, askingPriceInr),
        sellerRecommendation: this.defaultSellerRecommendation(result),
        talkingPoints: this.defaultTalkingPoints(result, extra?.msrpInr),
      };
    }
  }

  private defaultExplanation(
    result: ValuationResult,
    askingPriceInr?: number,
    extra?: { msrpInr?: number | null; conditionGrade?: string; ageMonths?: number; city?: string },
  ): string {
    const parts: string[] = [];

    if (extra?.msrpInr && extra.msrpInr > 0) {
      const depr = Math.round((1 - result.fairValueMidInr / extra.msrpInr) * 100);
      parts.push(
        `The original/MRP price of ${result.productLabel} is ${inr(extra.msrpInr)}.` +
        ` After ${extra.ageMonths ? `${extra.ageMonths} months of use and ` : ""}` +
        `${extra.conditionGrade ? `${extra.conditionGrade.replace("_", " ").toLowerCase()} condition, ` : ""}` +
        `it has depreciated approximately ${depr}%.`,
      );
    }

    parts.push(
      `The fair second-hand value is ${inr(result.fairValueMinInr)}–${inr(result.fairValueMaxInr)}` +
      ` (mid-point ${inr(result.fairValueMidInr)})` +
      `, based on ${result.comparableCount} marketplace comparables.`,
    );

    if (askingPriceInr) {
      const label = result.verdict.toLowerCase().replace("_", " ");
      parts.push(
        `The asking price of ${inr(askingPriceInr)} is ${label} vs. the fair range.`,
      );
    }

    if (extra?.city) {
      parts.push(`Prices in ${extra.city} are factored into this estimate.`);
    }

    return parts.join(" ");
  }

  private defaultBuyerVerdict(result: ValuationResult, askingPriceInr?: number): string {
    if (askingPriceInr === undefined) {
      return `A fair offer would be around ${inr(result.negotiationMinInr)}–${inr(result.fairValueMidInr)}.`;
    }
    if (result.verdict === "UNDERPRICED") {
      return `This is priced below fair market value — a good buy if condition checks out in person.`;
    }
    if (result.verdict === "FAIR") {
      return `This is fairly priced. Inspect the device and try negotiating to ${inr(result.fairValueMinInr)}.`;
    }
    if (result.verdict === "SLIGHTLY_HIGH") {
      return `Slightly above fair range. Negotiate toward ${inr(result.fairValueMidInr)} with comparable evidence.`;
    }
    return `Overpriced vs. market. Counter-offer at ${inr(result.fairValueMidInr)} and show the seller this FairPrice report.`;
  }

  private defaultSellerRecommendation(result: ValuationResult): string {
    return (
      `List at ${inr(result.recommendedListingInr)} for the best response within 1–2 weeks.` +
      ` If you need a quick sale, price at ${inr(result.quickSaleInr)}.`
    );
  }

  private defaultTalkingPoints(result: ValuationResult, msrpInr?: number | null): string[] {
    const points: string[] = [];

    if (msrpInr && msrpInr > 0) {
      const depr = Math.round((1 - result.fairValueMidInr / msrpInr) * 100);
      points.push(`Original price was ${inr(msrpInr)} — this is ${depr}% depreciated, which is typical for this product.`);
    }

    points.push(`Fair market range is ${inr(result.fairValueMinInr)}–${inr(result.fairValueMaxInr)} based on real listings.`);

    if (result.comparableCount > 0) {
      points.push(`Price is supported by ${result.comparableCount} comparable listings in the market.`);
    }

    if (result.marketTrend === "down") {
      points.push("Market prices for this product are trending down — acting quickly benefits the seller.");
    } else if (result.marketTrend === "up") {
      points.push("Demand is rising for this product, supporting the asking price.");
    }

    for (const f of result.factors.slice(0, 2)) {
      if (f.description) points.push(f.description);
    }

    return points.slice(0, 5);
  }
}

export const valuationExplanationService = new ValuationExplanationService();
