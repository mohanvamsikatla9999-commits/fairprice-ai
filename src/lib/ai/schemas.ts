import { z } from "zod";

export const priceVerdictSchema = z.enum([
  "UNDERPRICED",
  "FAIR",
  "SLIGHTLY_HIGH",
  "OVERPRICED",
  "UNKNOWN",
]);

export const conditionGradeSchema = z.enum([
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
]);

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const valuationFactorSchema = z.object({
  name: z.string(),
  impactInr: z.number().optional(),
  impactPct: z.number().optional(),
  description: z.string().optional(),
});

export const valuationExplanationSchema = z.object({
  explanation: z.string(),
  buyerVerdict: z.string().optional(),
  sellerRecommendation: z.string().optional(),
  talkingPoints: z.array(z.string()).default([]),
});

export const valuationAiSchema = z.object({
  fairValueMinInr: z.number().int().nonnegative(),
  fairValueMaxInr: z.number().int().nonnegative(),
  fairValueMidInr: z.number().int().nonnegative(),
  recommendedListingInr: z.number().int().nonnegative().optional(),
  expectedSaleMinInr: z.number().int().nonnegative().optional(),
  expectedSaleMaxInr: z.number().int().nonnegative().optional(),
  quickSaleInr: z.number().int().nonnegative().optional(),
  confidence: z.number().min(0).max(1).optional(),
  verdict: priceVerdictSchema.optional(),
  explanation: z.string().optional(),
  factors: z.array(valuationFactorSchema).optional(),
});

export const conditionAiSchema = z.object({
  score: z.number().min(0).max(100),
  grade: conditionGradeSchema,
  confidence: z.number().min(0).max(1),
  visibleDamage: z.array(z.string()).default([]),
  scratches: z.string().optional(),
  dents: z.string().optional(),
  cracks: z.string().optional(),
  screenCondition: z.string().optional(),
  bodyCondition: z.string().optional(),
  wear: z.string().optional(),
  missingAccessories: z.array(z.string()).default([]),
  cleanliness: z.string().optional(),
  modifications: z.string().optional(),
  suspiciousPatterns: z.array(z.string()).default([]),
  explanation: z.string(),
  insufficientQuality: z.boolean().default(false),
});

export const fraudAiSchema = z.object({
  score: z.number().min(0).max(100),
  level: riskLevelSchema,
  summary: z.string(),
  signals: z
    .array(
      z.object({
        signalType: z.string(),
        weight: z.number(),
        evidence: z.record(z.unknown()).optional(),
      }),
    )
    .default([]),
  recommendations: z.array(z.string()).default([]),
});

export const negotiationAiSchema = z.object({
  suggestedOfferInr: z.number().int().nonnegative(),
  walkAwayInr: z.number().int().nonnegative(),
  stretchInr: z.number().int().nonnegative(),
  strategy: z.string(),
  talkingPoints: z.array(z.string()).default([]),
});

export const searchFiltersAiSchema = z.object({
  query: z.string().default(""),
  categorySlug: z.string().nullable().optional(),
  minPriceInr: z.number().int().nonnegative().nullable().optional(),
  maxPriceInr: z.number().int().nonnegative().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  conditionGrade: conditionGradeSchema.nullable().optional(),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "newest"])
    .default("relevance"),
  keywords: z.array(z.string()).default([]),
});

export const listingCopyAiSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  suggestedPriceInr: z.number().int().nonnegative().nullable().optional(),
});

export const supportAiSchema = z.object({
  reply: z.string(),
  suggestedActions: z.array(z.string()).default([]),
  escalate: z.boolean().default(false),
});

export const productIdentifyAiSchema = z.object({
  brand: z.string(),
  model: z.string(),
  productLabel: z.string(),
  categorySlug: z.string().default("mobiles"),
  estimatedMsrpInr: z.number().int().positive().nullable().optional(),
  confidence: z.number().min(0).max(1),
  storage: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  notes: z.string().optional(),
  insufficientQuality: z.boolean().default(false),
});

export type ValuationExplanationAi = z.infer<typeof valuationExplanationSchema>;
export type ValuationAi = z.infer<typeof valuationAiSchema>;
export type ConditionAi = z.infer<typeof conditionAiSchema>;
export type FraudAi = z.infer<typeof fraudAiSchema>;
export type NegotiationAi = z.infer<typeof negotiationAiSchema>;
export type SearchFiltersAi = z.infer<typeof searchFiltersAiSchema>;
export type ListingCopyAi = z.infer<typeof listingCopyAiSchema>;
export type SupportAi = z.infer<typeof supportAiSchema>;
export type ProductIdentifyAi = z.infer<typeof productIdentifyAiSchema>;
