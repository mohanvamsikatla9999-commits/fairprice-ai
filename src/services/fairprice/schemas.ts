import { z } from "zod";
import { calculationBreakdownSchema } from "./breakdown";
import { FAIRPRICE_VERSIONS } from "./versions";

/** Attribute with provenance — never silently treat inference as fact. */
export const attributedValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1),
  source: z.enum([
    "image",
    "ocr",
    "user",
    "marketplace",
    "catalog",
    "inference",
    "unknown",
    "amazon",
    "flipkart",
    "model_inference",
    "calculation",
  ]),
});

export type AttributedValue = z.infer<typeof attributedValueSchema>;

export const productIdentitySchema = z.object({
  category: z.string().nullable(),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  variant: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  ram: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  identityConfidence: z.number().min(0).max(1),
  productLabel: z.string(),
  catalogProductId: z.string().nullable().optional(),
  catalogVariantId: z.string().nullable().optional(),
  msrpInr: z.number().int().positive().nullable().optional(),
});

export type ProductIdentity = z.infer<typeof productIdentitySchema>;

export const conditionResultSchema = z.object({
  label: z.enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR", "NEW"]),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  factors: z.array(z.string()),
  observed: z.record(z.string()).optional(),
  unknown: z.array(z.string()).optional(),
  evidence: z
    .array(
      z.object({
        key: z.string(),
        value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
        kind: z.enum(["OBSERVED", "USER_PROVIDED", "INFERRED", "UNKNOWN"]),
      }),
    )
    .optional(),
});

export type ConditionResult = z.infer<typeof conditionResultSchema>;

export const externalPriceRefSchema = z.object({
  source: z.enum(["amazon", "flipkart", "catalog", "marketplace"]),
  title: z.string(),
  priceInr: z.number().int().positive().nullable(),
  listPriceInr: z.number().int().positive().nullable().optional(),
  currency: z.literal("INR").default("INR"),
  url: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  matchScore: z.number().min(0).max(1),
  retrievedAt: z.string(),
  expiresAt: z.string().nullable().optional(),
  freshness: z.enum(["fresh", "recent", "stale", "old"]),
  available: z.boolean(),
});

export type ExternalPriceRef = z.infer<typeof externalPriceRefSchema>;

export const comparableEvidenceSchema = z.object({
  listingId: z.string().optional(),
  title: z.string(),
  priceInr: z.number().int().positive(),
  condition: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  soldStatus: z.enum(["asking", "sold", "unknown"]),
  evidenceType: z
    .enum([
      "TRANSACTION_PRICE",
      "SOLD_PRICE",
      "ACCEPTED_OFFER",
      "OFFER_PRICE",
      "ASKING_PRICE",
      "UNKNOWN",
    ])
    .optional(),
  tier: z.enum(["A", "B", "C", "D"]).optional(),
  similarityScore: z.number().min(0).max(1),
  freshnessScore: z.number().min(0).max(1),
  isSynthetic: z.boolean().optional(),
});

export type ComparableEvidence = z.infer<typeof comparableEvidenceSchema>;

export const fairPriceValuationSchema = z.object({
  fairLow: z.number().int().positive(),
  fairMid: z.number().int().positive(),
  fairHigh: z.number().int().positive(),
  recommendedListingPrice: z.number().int().positive(),
  expectedSellingPrice: z.number().int().positive(),
  quickSalePrice: z.number().int().positive(),
  /** User-facing rounded display helpers */
  displayFairLow: z.number().int().positive().optional(),
  displayFairHigh: z.number().int().positive().optional(),
});

export const confidenceSchema = z.object({
  overall: z.number().min(0).max(1),
  label: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
  reasons: z.array(z.string()).optional(),
});

export const fairPriceScoreSchema = z.object({
  score: z.number().min(0).max(100).nullable(),
  label: z.string().nullable(),
  askingPriceInr: z.number().int().positive().nullable(),
  deltaVsMidInr: z.number().int().nullable(),
  relativeBand: z
    .enum(["below", "within", "above", "unknown"])
    .nullable(),
});

export const fairPriceStatusSchema = z.enum([
  "SUCCESS",
  "OK", // alias retained for backward compatibility
  "INSUFFICIENT_DATA",
  "IDENTITY_UNCERTAIN",
  "IDENTITY_CONFLICT",
  "UNSUPPORTED_CATEGORY",
  "EXTERNAL_DATA_UNAVAILABLE",
  "ERROR",
]);

export const fairPriceResultSchema = z.object({
  status: fairPriceStatusSchema,
  product: productIdentitySchema,
  condition: conditionResultSchema,
  market: z.object({
    location: z.string().nullable(),
    currency: z.literal("INR"),
    demand: z.enum(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    liquidityScore: z.number().min(0).max(1),
    expectedDaysToSell: z.number().int().positive().nullable(),
  }),
  valuation: fairPriceValuationSchema.nullable(),
  confidence: confidenceSchema,
  fairPriceScore: fairPriceScoreSchema.nullable(),
  evidence: z.object({
    marketplaceComparables: z.number().int().min(0),
    soldComparables: z.number().int().min(0),
    askingComparables: z.number().int().min(0),
    amazonReferences: z.number().int().min(0),
    flipkartReferences: z.number().int().min(0),
    newPriceReferenceInr: z.number().int().positive().nullable(),
    comparables: z.array(comparableEvidenceSchema),
    amazon: z.array(externalPriceRefSchema),
    flipkart: z.array(externalPriceRefSchema),
    tierCounts: z
      .object({
        A: z.number().int().min(0),
        B: z.number().int().min(0),
        C: z.number().int().min(0),
        D: z.number().int().min(0),
      })
      .optional(),
  }),
  explanation: z.array(z.string()),
  questions: z.array(z.string()),
  missingInformation: z
    .array(
      z.object({
        key: z.string(),
        question: z.string(),
        materiality: z.enum(["critical", "helpful"]),
      }),
    )
    .optional(),
  anomalies: z
    .array(
      z.object({
        code: z.string(),
        severity: z.enum(["info", "warn"]),
        message: z.string(),
      }),
    )
    .optional(),
  factors: z.array(
    z.object({
      name: z.string(),
      impactInr: z.number().int(),
      impactPct: z.number(),
      description: z.string(),
    }),
  ),
  calculationBreakdown: calculationBreakdownSchema.nullable().optional(),
  calculationMetadata: z
    .object({
      versions: z.record(z.string()),
      strategyId: z.string().optional(),
      reproducible: z.literal(true),
    })
    .optional(),
  meta: z.object({
    engineVersion: z.string(),
    pipelineVersion: z.string(),
    providers: z.record(z.string()),
    durationMs: z.number().int().nonnegative(),
    valuationId: z.string().nullable().optional(),
    versions: z.record(z.string()).optional(),
  }),
  message: z.string().nullable().optional(),
});

export type FairPriceResult = z.infer<typeof fairPriceResultSchema>;

export const fairPriceInputSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().optional(),
        base64: z.string().optional(),
        mimeType: z.string().optional(),
        role: z
          .enum(["front", "back", "screen", "side", "label", "box", "damage", "other"])
          .optional(),
      }),
    )
    .optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  categorySlug: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  askingPriceInr: z.number().int().positive().optional(),
  msrpInr: z.number().int().positive().optional(),
  conditionGrade: z
    .enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .optional(),
  conditionScore: z.number().min(0).max(100).optional(),
  ageMonths: z.number().int().min(0).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  area: z.string().optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  userProvidedFacts: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  listingId: z.string().optional(),
  persist: z.boolean().optional().default(true),
  skipExternal: z.boolean().optional().default(false),
  skipVision: z.boolean().optional().default(false),
});

export type FairPriceInput = z.infer<typeof fairPriceInputSchema>;

export const PIPELINE_VERSION = FAIRPRICE_VERSIONS.pipelineVersion;
export const MIN_COMPARABLES_FOR_OK = 2;
export const MIN_CONFIDENCE_TO_SHOW = 0.35;

/** Round user-facing prices to avoid fake precision (e.g. ₹44,217). */
export function roundDisplayInr(n: number): number {
  if (n >= 100_000) return Math.round(n / 1000) * 1000;
  if (n >= 10_000) return Math.round(n / 500) * 500;
  if (n >= 1000) return Math.round(n / 100) * 100;
  return Math.round(n);
}
