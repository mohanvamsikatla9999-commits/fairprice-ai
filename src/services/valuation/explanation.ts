import { getAIService } from "@/lib/ai/service";
import type { ValuationResult } from "./model";

export class ValuationExplanationService {
  async explain(result: ValuationResult, askingPriceInr?: number): Promise<{
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
      });

      return {
        explanation: data.explanation,
        buyerVerdict: data.buyerVerdict ?? this.defaultBuyerVerdict(result, askingPriceInr),
        sellerRecommendation:
          data.sellerRecommendation ?? this.defaultSellerRecommendation(result),
        talkingPoints: data.talkingPoints ?? [],
      };
    } catch {
      return {
        explanation: this.defaultExplanation(result, askingPriceInr),
        buyerVerdict: this.defaultBuyerVerdict(result, askingPriceInr),
        sellerRecommendation: this.defaultSellerRecommendation(result),
        talkingPoints: result.factors.slice(0, 3).map((f) => f.description),
      };
    }
  }

  private defaultExplanation(result: ValuationResult, askingPriceInr?: number): string {
    const ask =
      askingPriceInr !== undefined
        ? ` Asking price ₹${askingPriceInr.toLocaleString("en-IN")} is marked ${result.verdict.toLowerCase().replace("_", " ")}.`
        : "";
    return (
      `FairPrice AI estimates a fair band of ₹${result.fairValueMinInr.toLocaleString("en-IN")}–₹${result.fairValueMaxInr.toLocaleString("en-IN")}` +
      ` (mid ₹${result.fairValueMidInr.toLocaleString("en-IN")}) based on ${result.comparableCount} comparables` +
      ` after condition, age, location, and demand adjustments.${ask}`
    );
  }

  private defaultBuyerVerdict(result: ValuationResult, askingPriceInr?: number): string {
    if (askingPriceInr === undefined) {
      return `Target offers near ₹${result.negotiationMinInr.toLocaleString("en-IN")}–₹${result.fairValueMidInr.toLocaleString("en-IN")}.`;
    }
    if (result.verdict === "UNDERPRICED" || result.verdict === "FAIR") {
      return "This looks like a reasonable buy if condition checks out in person.";
    }
    return `Negotiate toward ₹${result.fairValueMidInr.toLocaleString("en-IN")} using recent comps.`;
  }

  private defaultSellerRecommendation(result: ValuationResult): string {
    return `List around ₹${result.recommendedListingInr.toLocaleString("en-IN")}; accept quick sale near ₹${result.quickSaleInr.toLocaleString("en-IN")} if you need speed.`;
  }
}

export const valuationExplanationService = new ValuationExplanationService();
