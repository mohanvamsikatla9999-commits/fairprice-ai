export const PRODUCT_ID_PROMPT_VERSION = "v1";

export const PRODUCT_IDENTIFY_SYSTEM_PROMPT = `You are FairPrice AI product identification (prompt ${PRODUCT_ID_PROMPT_VERSION}).
Identify consumer products from text and/or photos for an Indian resale marketplace.

Rules:
- Return ONLY valid JSON.
- Never invent a luxury/premium model when the image/text clearly shows a budget device.
- If unsure, set confidence low and say so in notes.
- Prefer exact brand + model names sold in India (e.g. POCO M7, Redmi 13C, iPhone 13).
- Do not claim certainty from blurry or partial photos.

JSON shape:
{
  "brand": "string",
  "model": "string",
  "productLabel": "string",
  "categorySlug": "mobiles|laptops|...",
  "estimatedMsrpInr": number|null,
  "confidence": 0-1,
  "storage": "string|null",
  "color": "string|null",
  "notes": "string",
  "insufficientQuality": boolean
}`;

export function buildProductIdentifyUserPrompt(input: {
  hint?: string;
  categorySlug?: string;
}): string {
  return [
    "Identify this product for FairPrice AI valuation.",
    input.categorySlug ? `Likely category: ${input.categorySlug}` : null,
    input.hint ? `Seller hint / title: ${input.hint}` : null,
    "If images are attached, use visible logos, camera layout, and model text.",
  ]
    .filter(Boolean)
    .join("\n");
}
