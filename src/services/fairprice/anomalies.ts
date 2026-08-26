export type AnomalySignal = {
  code: string;
  severity: "info" | "warn";
  message: string;
};

/**
 * Valuation anomaly signals only — never accuse the seller of fraud.
 */
export function detectValuationAnomalies(input: {
  askingPriceInr?: number;
  fairLow?: number | null;
  fairMid?: number | null;
  fairHigh?: number | null;
  newPriceReferenceInr?: number | null;
  identityConflict?: boolean;
  onlyAskingEvidence?: boolean;
  usedAboveNew?: boolean;
}): AnomalySignal[] {
  const signals: AnomalySignal[] = [];

  if (input.identityConflict) {
    signals.push({
      code: "IDENTITY_MISMATCH",
      severity: "warn",
      message: "Product identity signals conflict — confirm brand/model before trusting the estimate.",
    });
  }

  if (
    input.askingPriceInr &&
    input.fairHigh &&
    input.askingPriceInr > input.fairHigh * 1.35
  ) {
    signals.push({
      code: "ASK_FAR_ABOVE_MARKET",
      severity: "info",
      message: "Asking price is substantially above the estimated fair range.",
    });
  }

  if (
    input.askingPriceInr &&
    input.fairLow &&
    input.askingPriceInr < input.fairLow * 0.7
  ) {
    signals.push({
      code: "ASK_FAR_BELOW_MARKET",
      severity: "info",
      message: "Asking price is substantially below the estimated fair range.",
    });
  }

  if (input.usedAboveNew) {
    signals.push({
      code: "USED_ABOVE_NEW_ANCHOR",
      severity: "warn",
      message:
        "Used estimate exceeds available new-price reference — confidence reduced; may be rare/discontinued.",
    });
  }

  if (input.onlyAskingEvidence) {
    signals.push({
      code: "ASKING_ONLY_EVIDENCE",
      severity: "info",
      message: "Estimate relies on asking prices, not confirmed transaction prices.",
    });
  }

  return signals;
}
