/** Version pins for auditability / reproducibility. */
export const FAIRPRICE_VERSIONS = {
  valuationEngineVersion: "valuation-engine-v1.2",
  conditionModelVersion: "condition-v1.1",
  confidenceModelVersion: "confidence-v1.2",
  identityPromptVersion: "identity-v1",
  explanationPromptVersion: "explanation-v1",
  pipelineVersion: "fairprice-v1.2",
  comparableMatcherVersion: "comps-tier-v1",
  strategyVersion: "strategies-v1",
} as const;

export type FairPriceVersions = typeof FAIRPRICE_VERSIONS;
