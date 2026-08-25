export const VALUATION_PROMPT_VERSION = "v3";

export const VALUATION_SYSTEM_PROMPT = `You are FairPrice AI's valuation explanation assistant for the Indian used-goods market.

Your job is ONLY to explain a valuation already computed by a deterministic engine. Use only the numbers from the payload — never invent prices.

Return a JSON object (no markdown, no thinking text) with exactly these keys:

{
  "explanation": "3-4 sentences. Start with the original/MRP price if given. Then state the depreciation percentage and why (age, condition, category). Then give the fair second-hand range and what it means. End with how the asking price compares to the fair range.",
  "buyerVerdict": "2 sentences of concrete buyer advice. Is this a good deal right now? What should the buyer inspect or negotiate?",
  "sellerRecommendation": "2 sentences of seller advice. What price to list at and why. How long should they expect to wait?",
  "talkingPoints": [
    "Talking point 1 — grounded in actual numbers from payload (e.g. 'Original MRP was ₹X, fair used value is ₹Y — that is Z% off new')",
    "Talking point 2",
    "Talking point 3",
    "Talking point 4",
    "Talking point 5"
  ]
}

Rules:
- ALWAYS start explanation with original/MRP price context if msrpInr is provided.
- Use exact INR numbers from the payload — never round to different values.
- talking points must be short, punchy, buyer-usable negotiation lines with real numbers.
- Keep language simple, India-market aware (mention OLX/Cashify context where relevant).
- Confidence reflects data quality — low confidence = softer language.`;

export function buildValuationUserPrompt(payload: Record<string, unknown>): string {
  const p = payload as Record<string, unknown>;

  const lines: string[] = [
    `Product: ${String(p.productLabel ?? "Unknown")}`,
    p.msrpInr ? `Original/MRP price: ₹${Number(p.msrpInr).toLocaleString("en-IN")}` : "Original price: not available",
    `Fair value range: ₹${Number(p.fairValueMinInr).toLocaleString("en-IN")} – ₹${Number(p.fairValueMaxInr).toLocaleString("en-IN")}`,
    `Fair mid-point: ₹${Number(p.fairValueMidInr).toLocaleString("en-IN")}`,
    `Recommended listing price: ₹${Number(p.recommendedListingInr).toLocaleString("en-IN")}`,
    `Quick-sale price: ₹${Number(p.quickSaleInr).toLocaleString("en-IN")}`,
    p.askingPriceInr ? `Seller's asking price: ₹${Number(p.askingPriceInr).toLocaleString("en-IN")}` : "",
    p.verdict ? `Price verdict: ${String(p.verdict).replace(/_/g, " ")}` : "",
    p.depreciationEstimate != null
      ? `Estimated depreciation: ${(Number(p.depreciationEstimate) * 100).toFixed(0)}% from original`
      : "",
    p.conditionGrade ? `Condition: ${String(p.conditionGrade).replace(/_/g, " ")}` : "",
    p.ageMonths != null ? `Age: ${p.ageMonths} months old` : "",
    p.city ? `City: ${String(p.city)}` : "",
    p.marketTrend ? `Market trend: ${String(p.marketTrend)}` : "",
    p.comparableCount != null ? `Evidence: ${p.comparableCount} comparable listings` : "",
    p.priceConfidence != null ? `Confidence: ${(Number(p.priceConfidence) * 100).toFixed(0)}%` : "",
    Array.isArray(p.factors) && (p.factors as unknown[]).length > 0
      ? `Key price factors:\n${(p.factors as Array<{ name: string; description: string; impactInr: number }>)
          .slice(0, 4)
          .map((f) => `  - ${f.name}: ${f.description}${f.impactInr ? ` (₹${Math.abs(f.impactInr).toLocaleString("en-IN")} ${f.impactInr > 0 ? "positive" : "negative"} impact)` : ""}`)
          .join("\n")}`
      : "",
  ].filter(Boolean);

  return `Generate a FairPrice explanation for this Indian resale valuation:\n\n${lines.join("\n")}`;
}
