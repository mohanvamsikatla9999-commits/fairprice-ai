import { describe, expect, it } from "vitest";
import {
  ASKING_PRICE_EVALUATION_SET,
  computeEvaluationMetrics,
  type PredictionResult,
} from "./dataset";

describe("evaluation harness", () => {
  it("has at least 50 curated asking-price records", () => {
    expect(ASKING_PRICE_EVALUATION_SET.length).toBeGreaterThanOrEqual(50);
    expect(
      ASKING_PRICE_EVALUATION_SET.every((r) => r.evidenceKind === "ASKING_PRICE_DATASET"),
    ).toBe(true);
  });

  it("computes MAE/MAPE/coverage without claiming transaction accuracy", () => {
    const predictions: PredictionResult[] = ASKING_PRICE_EVALUATION_SET.slice(0, 10).map(
      (r) => ({
        recordId: r.id,
        predictedMid: r.actualPrice * 1.05,
        fairLow: Math.round(r.actualPrice * 0.9),
        fairHigh: Math.round(r.actualPrice * 1.15),
        confidence: 0.7,
        status: "SUCCESS",
        category: r.category,
        actualPrice: r.actualPrice,
        evidenceKind: r.evidenceKind,
      }),
    );
    const metrics = computeEvaluationMetrics(predictions);
    expect(metrics.n).toBe(10);
    expect(metrics.mae).toBeGreaterThan(0);
    expect(metrics.mape).toBeGreaterThan(0);
    expect(metrics.intervalCoverage).toBeGreaterThan(0.5);
    expect(metrics.datasetNote).toContain("ASKING_PRICE_DATASET");
    expect(metrics.datasetNote).not.toMatch(/92% accurate/i);
  });
});
