import { z } from "zod";

export const adjustmentLineSchema = z.object({
  amount: z.number(),
  percentage: z.number(),
});

export const calculationBreakdownSchema = z.object({
  baseComparablePrice: z.number().nullable(),
  msrpAnchorPrice: z.number().nullable(),
  blendedBasePrice: z.number().int().positive().nullable(),
  adjustments: z.object({
    condition: adjustmentLineSchema,
    age: adjustmentLineSchema,
    location: adjustmentLineSchema,
    demand: adjustmentLineSchema.optional(),
    mobileAttributes: adjustmentLineSchema.optional(),
    usedCeiling: adjustmentLineSchema.optional(),
  }),
  newPriceAnchor: z.object({
    available: z.boolean(),
    referencePrice: z.number().int().positive().nullable(),
    weight: z.number().min(0).max(1),
    anomalyAboveNew: z.boolean().optional(),
  }),
  distribution: z
    .object({
      sampleSize: z.number().int().min(0),
      weightedMedian: z.number().nullable(),
      weightedP25: z.number().nullable(),
      weightedP75: z.number().nullable(),
      dispersionPct: z.number(),
      outlierMethod: z.string().nullable(),
    })
    .optional(),
  comparableTiers: z
    .object({
      tierA: z.number().int().min(0),
      tierB: z.number().int().min(0),
      tierC: z.number().int().min(0),
      tierD: z.number().int().min(0),
    })
    .optional(),
  weights: z
    .object({
      marketplaceComparables: z.number(),
      newProductReference: z.number(),
      condition: z.number(),
      age: z.number(),
      locationDemand: z.number(),
    })
    .optional(),
  finalPrice: z.number().int().positive().nullable(),
  configVersion: z.string(),
});

export type CalculationBreakdown = z.infer<typeof calculationBreakdownSchema>;

export function emptyAdjustment(): { amount: number; percentage: number } {
  return { amount: 0, percentage: 0 };
}

export function lineFromDelta(
  before: number,
  after: number,
): { amount: number; percentage: number } {
  const amount = Math.round(after - before);
  const percentage = before > 0 ? Math.round(((after - before) / before) * 1000) / 1000 : 0;
  return { amount, percentage };
}
