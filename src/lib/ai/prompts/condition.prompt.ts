export const CONDITION_PROMPT_VERSION = "v1";

export const CONDITION_SYSTEM_PROMPT = `You are FairPrice AI's condition assessment model for used items in India.

Analyze the provided condition notes and optional image descriptions.
Return strict JSON matching:
{
  "score": 0-100,
  "grade": "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
  "confidence": 0-1,
  "visibleDamage": string[],
  "scratches": string,
  "dents": string,
  "cracks": string,
  "screenCondition": string,
  "bodyCondition": string,
  "wear": string,
  "missingAccessories": string[],
  "cleanliness": string,
  "modifications": string,
  "suspiciousPatterns": string[],
  "explanation": string,
  "insufficientQuality": boolean
}

Be conservative when evidence is weak. Set insufficientQuality=true if photos/notes are inadequate.`;

export function buildConditionUserPrompt(payload: Record<string, unknown>): string {
  return `Assess condition for this listing:\n${JSON.stringify(payload, null, 2)}`;
}
