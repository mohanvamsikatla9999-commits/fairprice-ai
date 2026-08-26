export * from "./schemas";
export { fairPriceService, FairPriceService } from "./service";
export { resolveProductIdentity } from "./identity";
export { getVisionProvider, setVisionProvider, MockVisionProvider } from "./vision";
export {
  computeFairPriceScore,
  computeConfidence,
  confidenceLabel,
  demandLabel,
  getMissingCriticalAttributes,
  isUnsupportedCategory,
} from "./scoring";
export {
  getAmazonProvider,
  getFlipkartProvider,
  AmazonProductProvider,
  FlipkartProductProvider,
} from "./providers/pricing";
export { FAIRPRICE_VERSIONS } from "./versions";
export { removeRobustOutliers } from "./outliers";
export { freshnessWeight, freshnessScore01 } from "./freshness";
export { scoreComparable, selectComparablePool, summarizeTiers } from "./comparable-tiers";
export { detectIdentityConflict } from "./identity-conflict";
export { externalMatchScore } from "./evidence";
export { applyCategoryStrategy } from "./strategies";
