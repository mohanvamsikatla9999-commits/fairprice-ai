import { describe, expect, it } from "vitest";
import {
  computePriceVerdict,
  verdictLabel,
} from "@/services/valuation/model";

describe("computePriceVerdict", () => {
  const fairMid = 50_000;
  const fairMin = 45_000;
  const fairMax = 55_000;

  it("returns UNKNOWN for missing or invalid asking price", () => {
    expect(computePriceVerdict(undefined, fairMid, fairMin, fairMax)).toBe(
      "UNKNOWN",
    );
    expect(computePriceVerdict(0, fairMid, fairMin, fairMax)).toBe("UNKNOWN");
    expect(computePriceVerdict(40_000, 0, fairMin, fairMax)).toBe("UNKNOWN");
  });

  it("returns UNDERPRICED for deep discounts", () => {
    expect(computePriceVerdict(38_000, fairMid, fairMin, fairMax)).toBe(
      "UNDERPRICED",
    );
  });

  it("returns FAIR near fair mid", () => {
    expect(computePriceVerdict(50_000, fairMid, fairMin, fairMax)).toBe("FAIR");
    expect(computePriceVerdict(52_000, fairMid, fairMin, fairMax)).toBe("FAIR");
  });

  it("returns SLIGHTLY_HIGH for moderate premium", () => {
    expect(computePriceVerdict(56_000, fairMid, fairMin, fairMax)).toBe(
      "SLIGHTLY_HIGH",
    );
  });

  it("returns OVERPRICED for large premium", () => {
    expect(computePriceVerdict(70_000, fairMid, fairMin, fairMax)).toBe(
      "OVERPRICED",
    );
  });

  it("maps verdict labels", () => {
    expect(verdictLabel("UNDERPRICED")).toBe("Underpriced");
    expect(verdictLabel("FAIR")).toBe("Fair price");
    expect(verdictLabel("SLIGHTLY_HIGH")).toBe("Slightly high");
    expect(verdictLabel("OVERPRICED")).toBe("Overpriced");
    expect(verdictLabel("UNKNOWN")).toBe("Unknown");
  });
});
