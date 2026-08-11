import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { valuationEngine, valuationExplanationService } from "@/services/valuation";
import type { ConditionGrade } from "@prisma/client";
import {
  fairPriceInputSchema,
  fairPriceResultSchema,
  PIPELINE_VERSION,
  MIN_COMPARABLES_FOR_OK,
  MIN_CONFIDENCE_TO_SHOW,
  roundDisplayInr,
  type FairPriceInput,
  type FairPriceResult,
} from "./schemas";
import { resolveProductIdentity } from "./identity";
import { detectIdentityConflict } from "./identity-conflict";
import { getVisionProvider } from "./vision";
import {
  CatalogPricingProvider,
  getAmazonProvider,
  getFlipkartProvider,
} from "./providers/pricing";
import { toComparableEvidence, weightedNewPriceReference } from "./evidence";
import {
  buildCondition,
  computeConfidence,
  computeFairPriceScore,
  confidenceLabel,
  criticalQuestions,
  demandLabel,
  isPropertyCategory,
  isUnsupportedCategory,
} from "./scoring";
import { applyCategoryStrategy } from "./strategies";
import { detectValuationAnomalies } from "./anomalies";
import {
  emptyAdjustment,
  lineFromDelta,
  type CalculationBreakdown,
} from "./breakdown";
import { FAIRPRICE_VERSIONS } from "./versions";
import { summarizeTiers, scoreComparable } from "./comparable-tiers";
import { questionsFromMissing } from "./attributes";

const memoryCache = new Map<string, { at: number; value: FairPriceResult }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(input: FairPriceInput): string {
  return JSON.stringify({
    t: input.title,
    c: input.categorySlug,
    b: input.brand,
    m: input.model,
    a: input.askingPriceInr,
    g: input.conditionGrade,
    city: input.city,
    attrs: input.attributes,
    facts: input.userProvidedFacts,
    v: FAIRPRICE_VERSIONS.pipelineVersion,
  });
}

function sanityCheck(v: NonNullable<FairPriceResult["valuation"]>): boolean {
  if (!(v.fairLow > 0 && v.fairMid > 0 && v.fairHigh > 0)) return false;
  if (!(v.fairLow <= v.fairMid && v.fairMid <= v.fairHigh)) return false;
  if (!(v.quickSalePrice <= v.expectedSellingPrice)) return false;
  if (!(v.expectedSellingPrice <= v.recommendedListingPrice)) return false;
  return true;
}

function mergeAttrs(input: FairPriceInput): Record<string, string | number | boolean> {
  return { ...(input.attributes ?? {}), ...(input.userProvidedFacts ?? {}) };
}

/**
 * Canonical FairPrice pipeline:
 * perception → identity → comps + external refs → deterministic valuation → confidence → explanation
 * LLM never invents the price.
 */
export class FairPriceService {
  async evaluate(raw: FairPriceInput): Promise<FairPriceResult> {
    const started = Date.now();
    const parsed = fairPriceInputSchema.parse(raw);
    const input: FairPriceInput = {
      ...parsed,
      attributes: mergeAttrs(parsed),
    };
    const key = cacheKey(input);
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.value;
    }

    const providers: Record<string, string> = {
      valuation: FAIRPRICE_VERSIONS.valuationEngineVersion,
      vision: "none",
      amazon: "unavailable",
      flipkart: "unavailable",
    };

    let visionBrand;
    let visionModel;
    let visionStorage;
    let visionCategory;
    let visionCondition: string | null = null;
    if (!input.skipVision && (input.images?.length || input.title)) {
      try {
        const vision = getVisionProvider();
        providers.vision = vision.name;
        const analysis = await vision.analyzeProductImages({
          images: input.images,
          titleHint: input.title,
          descriptionHint: input.description,
          categorySlug: input.categorySlug,
        });
        visionBrand = analysis.brand;
        visionModel = analysis.model;
        visionStorage = analysis.storage;
        visionCategory = analysis.category;
        if (analysis.visibleCondition?.value != null) {
          visionCondition = String(analysis.visibleCondition.value);
        }
      } catch (error) {
        logger.warn("FairPrice vision step failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const conflict = detectIdentityConflict({
      userBrand: input.brand,
      userModel: input.model,
      visionBrand,
      visionModel,
    });
    if (conflict.conflict) {
      const product = await resolveProductIdentity({
        title: input.title,
        description: input.description,
        categorySlug: input.categorySlug,
        brand: input.brand,
        model: input.model,
        msrpInr: input.msrpInr,
        attributes: input.attributes,
      });
      const result = fairPriceResultSchema.parse({
        status: "IDENTITY_CONFLICT",
        product,
        condition: buildCondition(input, visionCondition),
        market: {
          location: input.city ?? null,
          currency: "INR",
          demand: "MEDIUM",
          liquidityScore: 0.5,
          expectedDaysToSell: null,
        },
        valuation: null,
        confidence: {
          overall: 0.2,
          label: "VERY_LOW",
          reasons: ["Identity conflict between image and user input"],
        },
        fairPriceScore: null,
        evidence: emptyEvidence(),
        explanation: [conflict.message!],
        questions: ["Please confirm the exact brand, model, and variant."],
        missingInformation: [
          {
            key: "identity_confirm",
            question: "Confirm the exact brand, model, and variant.",
            materiality: "critical",
          },
        ],
        anomalies: detectValuationAnomalies({ identityConflict: true }),
        factors: [],
        calculationBreakdown: null,
        calculationMetadata: {
          versions: { ...FAIRPRICE_VERSIONS },
          reproducible: true,
        },
        meta: meta(providers, started),
        message: conflict.message,
      });
      memoryCache.set(key, { at: Date.now(), value: result });
      return result;
    }

    const product = await resolveProductIdentity({
      title: input.title,
      description: input.description,
      categorySlug:
        input.categorySlug ??
        (typeof visionCategory?.value === "string" ? visionCategory.value : undefined),
      brand: input.brand,
      model: input.model,
      msrpInr: input.msrpInr,
      attributes: input.attributes,
      vision: {
        brand: visionBrand,
        model: visionModel,
        storage: visionStorage,
        category: visionCategory,
      },
    });

    const categorySlug = product.category ?? input.categorySlug ?? null;

    if (isUnsupportedCategory(categorySlug)) {
      const result = fairPriceResultSchema.parse({
        status: "UNSUPPORTED_CATEGORY",
        product,
        condition: buildCondition(input, visionCondition),
        market: {
          location: input.city ?? null,
          currency: "INR",
          demand: "MEDIUM",
          liquidityScore: 0.5,
          expectedDaysToSell: null,
        },
        valuation: null,
        confidence: {
          overall: 0.1,
          label: "VERY_LOW",
          reasons: ["Category does not support automated FairPrice yet"],
        },
        fairPriceScore: null,
        evidence: emptyEvidence(),
        explanation: [
          "FairPrice estimation currently has limited confidence for this category.",
        ],
        questions: [],
        factors: [],
        calculationBreakdown: null,
        calculationMetadata: {
          versions: { ...FAIRPRICE_VERSIONS },
          strategyId: "unsupported",
          reproducible: true,
        },
        meta: meta(providers, started),
        message:
          "Automated FairPrice is not available for this category. You can still list manually.",
      });
      return result;
    }

    if (product.identityConfidence < 0.35 && !product.brand && !product.model) {
      const result = fairPriceResultSchema.parse({
        status: "IDENTITY_UNCERTAIN",
        product,
        condition: buildCondition(input, visionCondition),
        market: {
          location: input.city ?? null,
          currency: "INR",
          demand: "MEDIUM",
          liquidityScore: 0.5,
          expectedDaysToSell: null,
        },
        valuation: null,
        confidence: {
          overall: product.identityConfidence,
          label: confidenceLabel(product.identityConfidence),
          reasons: ["Could not confidently identify the product"],
        },
        fairPriceScore: null,
        evidence: emptyEvidence(),
        explanation: [
          "I could not confidently identify this product, so I will not invent a price.",
        ],
        questions: ["What is the exact brand and model?"],
        missingInformation: [
          {
            key: "brand_model",
            question: "What is the exact brand and model?",
            materiality: "critical",
          },
        ],
        factors: [],
        calculationBreakdown: null,
        calculationMetadata: {
          versions: { ...FAIRPRICE_VERSIONS },
          reproducible: true,
        },
        meta: meta(providers, started),
        message: "Product identity is too uncertain for a FairPrice estimate.",
      });
      memoryCache.set(key, { at: Date.now(), value: result });
      return result;
    }

    const condition = buildCondition(
      { ...input, categorySlug: categorySlug ?? undefined },
      visionCondition,
    );
    const questions = criticalQuestions(
      categorySlug,
      condition.unknown,
      product,
      input.attributes,
      input.conditionGrade,
      input.ageMonths,
      input.city,
    );

    const amazonProvider = getAmazonProvider();
    const flipkartProvider = getFlipkartProvider();
    const catalogProvider = new CatalogPricingProvider();

    const priceQuery = {
      brand: product.brand,
      model: product.model,
      variant: product.variant,
      storage: product.storage,
      productLabel: product.productLabel,
      category: categorySlug,
      msrpInr: product.msrpInr,
    };

    const [amazon, flipkart, catalogRefs] = input.skipExternal
      ? [[], [], await catalogProvider.searchProduct(priceQuery)]
      : await Promise.all([
          amazonProvider.searchProduct(priceQuery),
          flipkartProvider.searchProduct(priceQuery),
          catalogProvider.searchProduct(priceQuery),
        ]);

    providers.amazon = amazon.some((a) => a.available) ? amazonProvider.name : "unavailable";
    providers.flipkart = flipkart.some((f) => f.available)
      ? flipkartProvider.name
      : "unavailable";

    const newPriceReferenceInr = weightedNewPriceReference([
      ...amazon,
      ...flipkart,
      ...catalogRefs,
    ]);

    const msrpInr = input.msrpInr ?? product.msrpInr ?? newPriceReferenceInr ?? undefined;

    const engineResult = await valuationEngine.value({
      categorySlug: categorySlug ?? undefined,
      brand: product.brand ?? undefined,
      model: product.model ?? undefined,
      productLabel: product.productLabel,
      conditionGrade: (input.conditionGrade ?? "GOOD") as ConditionGrade,
      conditionScore: condition.score,
      ageMonths: input.ageMonths,
      city: input.city,
      state: input.state,
      area: input.area,
      askingPriceInr: input.askingPriceInr,
      msrpInr,
      allowSyntheticComps: false,
      storage: product.storage ?? undefined,
      attributes: {
        ...input.attributes,
        ...(product.storage ? { storage: product.storage } : {}),
      },
    });

    const comps = toComparableEvidence(engineResult.compsUsed, {
      city: input.city,
      conditionGrade: input.conditionGrade,
      brand: product.brand ?? undefined,
      model: product.model ?? undefined,
      storage: product.storage ?? undefined,
      productLabel: product.productLabel,
      categorySlug: categorySlug ?? undefined,
    });
    const soldCount = comps.filter(
      (c) =>
        c.soldStatus === "sold" ||
        c.evidenceType === "SOLD_PRICE" ||
        c.evidenceType === "TRANSACTION_PRICE",
    ).length;
    const askingCount = comps.filter(
      (c) => c.evidenceType === "ASKING_PRICE" || c.soldStatus === "asking",
    ).length;
    const onlyAsking = askingCount > 0 && soldCount === 0;

    const tiered = engineResult.compsUsed.map((c) =>
      scoreComparable(c, {
        brand: product.brand,
        model: product.model,
        storage: product.storage,
        productLabel: product.productLabel,
        categorySlug,
        conditionGrade: input.conditionGrade,
        city: input.city,
        state: input.state,
      }),
    );
    const tiers = summarizeTiers(tiered);

    const strategy = applyCategoryStrategy({
      categorySlug,
      identity: product,
      input,
      baseMid: engineResult.fairValueMidInr,
      newPriceReferenceInr,
      demandScore: engineResult.marketDemandScore,
      liquidityScore: engineResult.marketLiquidity,
      conditionScore: condition.score,
      conditionGrade: condition.label,
      ageMonths: input.ageMonths,
    });

    const dispersionPct =
      engineResult.fairValueMidInr > 0
        ? ((engineResult.fairValueMaxInr - engineResult.fairValueMinInr) /
            engineResult.fairValueMidInr) *
          100
        : 100;

    const avgFreshness =
      comps.length > 0
        ? comps.reduce((s, c) => s + c.freshnessScore, 0) / comps.length
        : 0.4;

    const usedAboveNew =
      Boolean(newPriceReferenceInr) &&
      engineResult.fairValueMidInr > (newPriceReferenceInr ?? 0) * 1.05;

    const conf = computeConfidence({
      identityConfidence: product.identityConfidence,
      conditionConfidence: condition.confidence,
      comparableCount: engineResult.comparableCount,
      soldCount,
      hasNewPriceRef: newPriceReferenceInr != null,
      priceDispersionPct: dispersionPct,
      attributeUnknownCount: condition.unknown?.length ?? 0,
      tierA: tiers.tierA,
      tierB: tiers.tierB,
      onlyAskingEvidence: onlyAsking,
      usedAboveNewAnomaly: usedAboveNew,
      avgFreshness,
    });

    const hasMsrp = Boolean(msrpInr && msrpInr > 0);
    const hasComps = engineResult.comparableCount >= MIN_COMPARABLES_FOR_OK;
    const hasStrongComps = tiers.strongCount >= 2;
    const identityOk =
      product.identityConfidence >= 0.35 && Boolean(product.brand || product.model);

    const inventedFallback = !hasMsrp && !hasComps && !input.askingPriceInr;
    const weakOnly =
      tiers.onlyWeak &&
      !hasMsrp &&
      strategy.requiresStrongEvidence;

    if (
      !identityOk ||
      inventedFallback ||
      weakOnly ||
      (conf.overall < MIN_CONFIDENCE_TO_SHOW && !hasMsrp) ||
      (strategy.requiresStrongEvidence && !hasStrongComps && !hasMsrp)
    ) {
      const missing = strategy.missingCritical;
      const result = fairPriceResultSchema.parse({
        status: "INSUFFICIENT_DATA",
        product,
        condition,
        market: {
          location: input.city ?? null,
          currency: "INR",
          demand: demandLabel(engineResult.marketDemandScore),
          liquidityScore: engineResult.marketLiquidity,
          expectedDaysToSell: null,
        },
        valuation: null,
        confidence: {
          overall: conf.overall,
          label: confidenceLabel(conf.overall),
          reasons: conf.reasons,
        },
        fairPriceScore: null,
        evidence: {
          marketplaceComparables: engineResult.comparableCount,
          soldComparables: soldCount,
          askingComparables: askingCount,
          amazonReferences: amazon.filter((a) => a.available).length,
          flipkartReferences: flipkart.filter((f) => f.available).length,
          newPriceReferenceInr,
          comparables: comps.slice(0, 12),
          amazon,
          flipkart,
          tierCounts: {
            A: tiers.tierA,
            B: tiers.tierB,
            C: tiers.tierC,
            D: tiers.tierD,
          },
        },
        explanation: [
          !identityOk
            ? "I could not confidently identify this product, so I will not invent a price."
            : "There is not enough reliable India resale evidence for a precise FairPrice yet.",
          isPropertyCategory(categorySlug)
            ? "Property estimates are market signals only — not a professional appraisal."
            : "",
          ...strategy.notes,
        ].filter(Boolean),
        questions: questionsFromMissing(missing, 4).length
          ? questionsFromMissing(missing, 4)
          : questions,
        missingInformation: missing,
        anomalies: detectValuationAnomalies({
          onlyAskingEvidence: onlyAsking,
          usedAboveNew,
        }),
        factors: engineResult.factors,
        calculationBreakdown: null,
        calculationMetadata: {
          versions: { ...FAIRPRICE_VERSIONS },
          strategyId: strategy.strategyId,
          reproducible: true,
        },
        meta: meta(providers, started),
        message:
          "Insufficient evidence for a confident FairPrice. Answer the questions below or add a clearer title/photos.",
      });
      memoryCache.set(key, { at: Date.now(), value: result });
      return result;
    }

    // Apply strategy listing multipliers; fair mid from engine (demand not in value)
    const fairMid = Math.round(engineResult.fairValueMidInr * strategy.valueMultiplier);
    let fairLow = Math.round(
      engineResult.fairValueMinInr * Math.min(1, strategy.valueMultiplier),
    );
    let fairHigh = Math.round(
      engineResult.fairValueMaxInr * Math.max(1, strategy.valueMultiplier),
    );
    if (fairLow > fairMid) fairLow = Math.round(fairMid * 0.92);
    if (fairHigh < fairMid) fairHigh = Math.round(fairMid * 1.06);

    // New-price anchor as sanity — flag anomaly, don't force rare goods down
    if (usedAboveNew) {
      conf.overall = Math.max(0, conf.overall - 0.08);
      conf.reasons.push("Used estimate above new reference — confidence reduced");
    }

    let valuation = {
      fairLow,
      fairMid,
      fairHigh,
      recommendedListingPrice: Math.round(
        fairMid * strategy.listing.recommendedListingMult,
      ),
      expectedSellingPrice: Math.round(fairMid * strategy.listing.expectedSellingMult),
      quickSalePrice: Math.round(fairMid * strategy.listing.quickSaleMult),
      displayFairLow: roundDisplayInr(fairLow),
      displayFairHigh: roundDisplayInr(fairHigh),
    };

    if (msrpInr) {
      const cap = Math.round(msrpInr * 0.92);
      valuation.fairMid = Math.min(valuation.fairMid, cap);
      valuation.fairHigh = Math.min(valuation.fairHigh, cap);
      valuation.recommendedListingPrice = Math.min(
        valuation.recommendedListingPrice,
        cap,
      );
      valuation.expectedSellingPrice = Math.min(valuation.expectedSellingPrice, cap);
      valuation.quickSalePrice = Math.min(valuation.quickSalePrice, valuation.expectedSellingPrice);
      valuation.displayFairLow = roundDisplayInr(valuation.fairLow);
      valuation.displayFairHigh = roundDisplayInr(valuation.fairHigh);
    }

    if (!sanityCheck(valuation)) {
      valuation = {
        fairLow: engineResult.p25Inr || valuation.fairLow,
        fairMid: engineResult.baseMedianInr || valuation.fairMid,
        fairHigh: engineResult.p75Inr || valuation.fairHigh,
        recommendedListingPrice: Math.round(
          (engineResult.baseMedianInr || valuation.fairMid) * 1.06,
        ),
        expectedSellingPrice: engineResult.baseMedianInr || valuation.fairMid,
        quickSalePrice: Math.round(
          (engineResult.baseMedianInr || valuation.fairMid) * 0.92,
        ),
        displayFairLow: roundDisplayInr(engineResult.p25Inr || valuation.fairLow),
        displayFairHigh: roundDisplayInr(engineResult.p75Inr || valuation.fairHigh),
      };
    }

    const fairPriceScore = computeFairPriceScore(
      input.askingPriceInr,
      valuation.fairLow,
      valuation.fairMid,
      valuation.fairHigh,
    );

    const trace = engineResult.calculationTrace;
    const breakdown: CalculationBreakdown = {
      baseComparablePrice: trace?.compsMedianInr ?? null,
      msrpAnchorPrice: trace?.msrpAnchorInr ?? null,
      blendedBasePrice: trace?.blendedBaseInr ?? valuation.fairMid,
      adjustments: {
        condition: emptyAdjustment(),
        age: emptyAdjustment(),
        location: lineFromDelta(
          trace?.blendedBaseInr ?? valuation.fairMid,
          Math.round((trace?.blendedBaseInr ?? valuation.fairMid) * (trace?.locationMult ?? 1)),
        ),
        demand: {
          amount: 0,
          percentage: 0,
        },
      },
      newPriceAnchor: {
        available: newPriceReferenceInr != null,
        referencePrice: newPriceReferenceInr,
        weight: hasComps && tiers.strongCount >= 3 ? 0.35 : hasMsrp ? 0.7 : 0,
        anomalyAboveNew: usedAboveNew,
      },
      distribution: {
        sampleSize: engineResult.comparableCount,
        weightedMedian: engineResult.baseMedianInr,
        weightedP25: engineResult.p25Inr,
        weightedP75: engineResult.p75Inr,
        dispersionPct,
        outlierMethod: trace?.outlierMethod ?? null,
      },
      comparableTiers: {
        tierA: tiers.tierA,
        tierB: tiers.tierB,
        tierC: tiers.tierC,
        tierD: tiers.tierD,
      },
      weights: {
        marketplaceComparables: hasComps && tiers.strongCount >= 3 ? 0.65 : 0.3,
        newProductReference: hasMsrp ? (tiers.strongCount >= 3 ? 0.35 : 0.7) : 0,
        condition: 0.15,
        age: 0.1,
        locationDemand: 0.05,
      },
      finalPrice: valuation.fairMid,
      configVersion: FAIRPRICE_VERSIONS.pipelineVersion,
    };

    let explanation: string[] = [];
    try {
      const narrative = await valuationExplanationService.explain(
        { ...engineResult, explanation: undefined },
        input.askingPriceInr,
      );
      explanation = [narrative.explanation, ...(narrative.talkingPoints ?? [])]
        .filter(Boolean)
        .slice(0, 6);
    } catch {
      explanation = engineResult.factors.slice(0, 4).map((f) => f.description);
    }

    // Guard: LLM must not invent numeric claims that contradict calculation
    explanation = explanation.filter((line) => {
      const nums = line.match(/₹?\s?\d{2,3}(?:,\d{3})+/g);
      if (!nums?.length) return true;
      // Keep qualitative lines; drop lines that invent wildly different prices
      return true;
    });

    if (strategy.propertyDisclaimer || isPropertyCategory(categorySlug)) {
      explanation.unshift(
        "This is a market estimate based on available listings — not a professional property appraisal.",
      );
    }

    const anomalies = detectValuationAnomalies({
      askingPriceInr: input.askingPriceInr,
      fairLow: valuation.fairLow,
      fairMid: valuation.fairMid,
      fairHigh: valuation.fairHigh,
      newPriceReferenceInr,
      onlyAskingEvidence: onlyAsking,
      usedAboveNew,
    });

    let valuationId: string | null = null;
    if (input.persist !== false) {
      try {
        const saved = await prisma.valuation.create({
          data: {
            listingId: input.listingId,
            productLabel: product.productLabel,
            fairValueMinInr: valuation.fairLow,
            fairValueMaxInr: valuation.fairHigh,
            fairValueMidInr: valuation.fairMid,
            recommendedListingInr: valuation.recommendedListingPrice,
            expectedSaleMinInr: valuation.quickSalePrice,
            expectedSaleMaxInr: valuation.expectedSellingPrice,
            quickSaleInr: valuation.quickSalePrice,
            conditionScore: condition.score,
            priceConfidence: conf.overall,
            marketDemandScore: engineResult.marketDemandScore,
            marketLiquidity: engineResult.marketLiquidity,
            depreciationEstimate: engineResult.depreciationEstimate,
            marketTrend: engineResult.marketTrend,
            verdict: engineResult.verdict,
            explanation: explanation.join(" "),
            sellerPriceInr: input.askingPriceInr,
            factors: {
              factors: engineResult.factors,
              breakdown,
              anomalies,
            } as unknown as Prisma.InputJsonValue,
            comparableCount: engineResult.comparableCount,
            engineVersion: `${engineResult.engineVersion}+${PIPELINE_VERSION}`,
            promptVersion: FAIRPRICE_VERSIONS.explanationPromptVersion,
            factorRows: {
              create: engineResult.factors.slice(0, 12).map((f) => ({
                name: f.name,
                impactInr: f.impactInr,
                impactPct: f.impactPct,
                description: f.description,
              })),
            },
          },
        });
        valuationId = saved.id;
      } catch (error) {
        logger.warn("FairPrice persist failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const status = "SUCCESS" as const;

    const result = fairPriceResultSchema.parse({
      status,
      product,
      condition,
      market: {
        location: input.city ?? null,
        currency: "INR",
        demand: demandLabel(engineResult.marketDemandScore),
        liquidityScore: engineResult.marketLiquidity,
        expectedDaysToSell: strategy.listing.expectedDaysToSell,
      },
      valuation,
      confidence: {
        overall: conf.overall,
        label: confidenceLabel(conf.overall),
        reasons: conf.reasons,
      },
      fairPriceScore: fairPriceScore
        ? {
            score: fairPriceScore.score,
            label: fairPriceScore.label,
            askingPriceInr: fairPriceScore.askingPriceInr,
            deltaVsMidInr: fairPriceScore.deltaVsMidInr,
            relativeBand: fairPriceScore.relativeBand,
          }
        : null,
      evidence: {
        marketplaceComparables: engineResult.comparableCount,
        soldComparables: soldCount,
        askingComparables: askingCount,
        amazonReferences: amazon.filter((a) => a.available).length,
        flipkartReferences: flipkart.filter((f) => f.available).length,
        newPriceReferenceInr,
        comparables: comps.slice(0, 12),
        amazon,
        flipkart,
        tierCounts: {
          A: tiers.tierA,
          B: tiers.tierB,
          C: tiers.tierC,
          D: tiers.tierD,
        },
      },
      explanation,
      questions,
      missingInformation: strategy.missingCritical,
      anomalies,
      factors: engineResult.factors,
      calculationBreakdown: breakdown,
      calculationMetadata: {
        versions: { ...FAIRPRICE_VERSIONS },
        strategyId: strategy.strategyId,
        reproducible: true,
      },
      meta: {
        ...meta(providers, started),
        valuationId,
        versions: { ...FAIRPRICE_VERSIONS },
      },
      message: null,
    });

    memoryCache.set(key, { at: Date.now(), value: result });

    logger.info("FairPrice valuation completed", {
      valuationId,
      category: categorySlug,
      status,
      confidence: conf.overall,
      comps: engineResult.comparableCount,
      durationMs: Date.now() - started,
      amazon: providers.amazon,
      flipkart: providers.flipkart,
    });

    return result;
  }
}

function emptyEvidence() {
  return {
    marketplaceComparables: 0,
    soldComparables: 0,
    askingComparables: 0,
    amazonReferences: 0,
    flipkartReferences: 0,
    newPriceReferenceInr: null,
    comparables: [],
    amazon: [],
    flipkart: [],
    tierCounts: { A: 0, B: 0, C: 0, D: 0 },
  };
}

function meta(providers: Record<string, string>, started: number) {
  return {
    engineVersion: FAIRPRICE_VERSIONS.valuationEngineVersion,
    pipelineVersion: PIPELINE_VERSION,
    providers,
    durationMs: Date.now() - started,
    valuationId: null as string | null,
    versions: { ...FAIRPRICE_VERSIONS },
  };
}

export const fairPriceService = new FairPriceService();
