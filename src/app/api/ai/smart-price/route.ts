import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { callGemini, parseGeminiJson } from "@/lib/ai/gemini-fetch";

const schema = z.object({
  productLabel: z.string().min(2),
  brand: z.string().optional(),
  model: z.string().optional(),
  categorySlug: z.string().optional(),
  conditionGrade: z.enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"]).optional(),
  conditionSummary: z.string().optional(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
  city: z.string().optional(),
  estimatedMrpInr: z.number().optional().nullable(),
  ageMonths: z.number().optional(),
  visibleDamage: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await jsonBody(request);
    if (!raw || typeof raw !== "object") {
      return fail("Request body must be JSON", 400, "INVALID_BODY");
    }

    const body = schema.parse(raw);

    const systemPrompt = `You are FairPrice AI — India's most accurate resale price estimator.
You specialise in the Indian second-hand market (OLX, Cashify, Flipkart, Amazon India, local bazaars).

Rules:
- Return ONLY a valid JSON object. No markdown. No explanation outside the JSON.
- Base prices on real Indian resale market data.
- Account for condition: POOR=30-45% of MRP, FAIR=45-60%, GOOD=55-70%, EXCELLENT=65-80%, LIKE_NEW=75-90%.
- Metro cities (Hyderabad, Bengaluru, Mumbai, Delhi) command slightly higher prices.
- recommendedListingInr = realistic price a seller can receive within 2 weeks.
- quickSaleInr = price for immediate sale within 48 hours.`;

    const specsText = body.specs
      ? Object.entries(body.specs)
          .filter(([, v]) => v !== null && v !== "" && v !== undefined)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join("\n")
      : "Not provided";

    const userPrompt = `Estimate the resale price for this product in India and return a JSON object:

Product: ${body.productLabel}
Category: ${body.categorySlug ?? "electronics"}
Condition: ${body.conditionGrade ?? "GOOD"}
${body.conditionSummary ? `Condition detail: ${body.conditionSummary}` : ""}
${body.visibleDamage?.length ? `Visible damage: ${body.visibleDamage.join(", ")}` : "No visible damage"}
${body.estimatedMrpInr ? `Original MRP: ₹${body.estimatedMrpInr.toLocaleString("en-IN")}` : ""}
${body.ageMonths ? `Age: ${body.ageMonths} months` : ""}
City: ${body.city ?? "Hyderabad"}
Specs:
${specsText}

Return this exact JSON shape (no other text):
{
  "fairRangeMinInr": <number>,
  "fairRangeMaxInr": <number>,
  "recommendedListingInr": <number>,
  "quickSaleInr": <number>,
  "verdict": "FAIR",
  "demandLevel": "MEDIUM",
  "depreciation": <number 0-100>,
  "explanation": "<2-3 sentences with original price vs second-hand price context>",
  "sellerTips": ["<tip1>", "<tip2>", "<tip3>"],
  "buyerWarnings": [],
  "confidence": <0.0-1.0>,
  "marketTrend": "STABLE",
  "buyerVerdict": "<1-2 sentences of concrete buyer advice — is this a good deal right now?>",
  "sellerRecommendation": "<1-2 sentences of seller advice — what price and how fast?>",
  "priceFactors": [
    { "factor": "<name>", "impact": "POSITIVE", "detail": "<brief>" }
  ]
}`;

    let rawText: string;
    try {
      rawText = await callGemini({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }, 30_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gemini unavailable";
      return fail(msg, 502, "GEMINI_ERROR");
    }

    let pricing: Record<string, unknown>;
    try {
      pricing = parseGeminiJson<Record<string, unknown>>(rawText);
    } catch (parseErr) {
      // Log the actual response so we can see what Gemini returned
      console.error("[smart-price] JSON parse failed. Raw response:", rawText.slice(0, 500));
      return fail(
        `AI returned non-JSON price response: ${rawText.slice(0, 200)}`,
        502,
        "PARSE_ERROR",
      );
    }

    return ok({ pricing });
  } catch (error) {
    return handleRouteError(error);
  }
}
