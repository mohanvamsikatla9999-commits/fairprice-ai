import { z } from "zod";
import { env } from "@/config/env";
import { createAIProvider, GeminiProvider } from "@/providers/ai";
import type { AIProvider, ChatMessage } from "@/providers/ai/types";
import { logger } from "@/lib/logger";
import {
  CONDITION_SYSTEM_PROMPT,
  buildConditionUserPrompt,
} from "@/lib/ai/prompts/condition.prompt";
import {
  FRAUD_SYSTEM_PROMPT,
  buildFraudUserPrompt,
} from "@/lib/ai/prompts/fraud.prompt";
import {
  LISTING_SYSTEM_PROMPT,
  buildListingUserPrompt,
} from "@/lib/ai/prompts/listing.prompt";
import {
  NEGOTIATION_SYSTEM_PROMPT,
  buildNegotiationUserPrompt,
} from "@/lib/ai/prompts/negotiation.prompt";
import {
  SEARCH_SYSTEM_PROMPT,
  buildSearchUserPrompt,
} from "@/lib/ai/prompts/search.prompt";
import {
  SUPPORT_SYSTEM_PROMPT,
  buildSupportUserPrompt,
} from "@/lib/ai/prompts/support.prompt";
import {
  VALUATION_SYSTEM_PROMPT,
  buildValuationUserPrompt,
} from "@/lib/ai/prompts/valuation.prompt";
import {
  PRODUCT_IDENTIFY_SYSTEM_PROMPT,
  buildProductIdentifyUserPrompt,
} from "@/lib/ai/prompts/identify.prompt";
import {
  conditionAiSchema,
  fraudAiSchema,
  listingCopyAiSchema,
  negotiationAiSchema,
  productIdentifyAiSchema,
  searchFiltersAiSchema,
  supportAiSchema,
  valuationAiSchema,
  valuationExplanationSchema,
  type ConditionAi,
  type FraudAi,
  type ListingCopyAi,
  type NegotiationAi,
  type ProductIdentifyAi,
  type SearchFiltersAi,
  type SupportAi,
  type ValuationAi,
  type ValuationExplanationAi,
} from "@/lib/ai/schemas";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Failed to parse AI JSON response");
  }
}

export class AIService {
  private provider: AIProvider | null = null;

  constructor(provider?: AIProvider) {
    this.provider = provider ?? null;
  }

  async getProvider(): Promise<AIProvider> {
    if (!this.provider) {
      this.provider = await createAIProvider();
    }
    return this.provider;
  }

  async chat(messages: ChatMessage[], json = true) {
    const provider = await this.getProvider();
    return provider.chat(messages, { json, temperature: 0.2 });
  }

  async completeJson<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
  ): Promise<{ data: T; model: string; provider: string; raw: string }> {
    const result = await this.chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      true,
    );

    try {
      const parsed = extractJson(result.content);
      const data = schema.parse(parsed);
      return {
        data,
        model: result.model,
        provider: result.provider,
        raw: result.content,
      };
    } catch (error) {
      logger.warn("AI JSON parse/validation failed", {
        error: error instanceof Error ? error.message : String(error),
        provider: result.provider,
        model: result.model,
      });
      throw error;
    }
  }

  async explainValuation(
    payload: Record<string, unknown>,
  ): Promise<ValuationExplanationAi> {
    const { data } = await this.completeJson(
      VALUATION_SYSTEM_PROMPT,
      buildValuationUserPrompt(payload),
      valuationExplanationSchema,
    );
    return {
      ...data,
      talkingPoints: data.talkingPoints ?? [],
    };
  }

  async assessCondition(payload: Record<string, unknown>): Promise<ConditionAi> {
    const { data } = await this.completeJson(
      CONDITION_SYSTEM_PROMPT,
      buildConditionUserPrompt(payload),
      conditionAiSchema,
    );
    return {
      ...data,
      visibleDamage: data.visibleDamage ?? [],
      missingAccessories: data.missingAccessories ?? [],
      suspiciousPatterns: data.suspiciousPatterns ?? [],
      insufficientQuality: data.insufficientQuality ?? false,
    };
  }

  async analyzeFraud(payload: Record<string, unknown>): Promise<FraudAi> {
    const { data } = await this.completeJson(
      FRAUD_SYSTEM_PROMPT,
      buildFraudUserPrompt(payload),
      fraudAiSchema,
    );
    return {
      ...data,
      signals: data.signals ?? [],
      recommendations: data.recommendations ?? [],
    };
  }

  async negotiate(payload: Record<string, unknown>): Promise<NegotiationAi> {
    const { data } = await this.completeJson(
      NEGOTIATION_SYSTEM_PROMPT,
      buildNegotiationUserPrompt(payload),
      negotiationAiSchema,
    );
    return {
      ...data,
      talkingPoints: data.talkingPoints ?? [],
    };
  }

  async parseSearch(query: string): Promise<SearchFiltersAi> {
    const { data } = await this.completeJson(
      SEARCH_SYSTEM_PROMPT,
      buildSearchUserPrompt(query),
      searchFiltersAiSchema,
    );
    return {
      ...data,
      query: data.query ?? query,
      keywords: data.keywords ?? [],
      sort: data.sort ?? "relevance",
    };
  }

  async improveListing(payload: Record<string, unknown>): Promise<ListingCopyAi> {
    const { data } = await this.completeJson(
      LISTING_SYSTEM_PROMPT,
      buildListingUserPrompt(payload),
      listingCopyAiSchema,
    );
    return {
      ...data,
      tags: data.tags ?? [],
    };
  }

  async supportReply(payload: Record<string, unknown>): Promise<SupportAi> {
    const { data } = await this.completeJson(
      SUPPORT_SYSTEM_PROMPT,
      buildSupportUserPrompt(payload),
      supportAiSchema,
    );
    return {
      ...data,
      suggestedActions: data.suggestedActions ?? [],
      escalate: data.escalate ?? false,
    };
  }

  async identifyProduct(input: {
    hint?: string;
    categorySlug?: string;
    imagesBase64?: string[];
  }): Promise<ProductIdentifyAi> {
    const provider = await this.getProvider();
    const messages: ChatMessage[] = [
      { role: "system", content: PRODUCT_IDENTIFY_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildProductIdentifyUserPrompt({
          hint: input.hint,
          categorySlug: input.categorySlug,
        }),
        images: input.imagesBase64?.slice(0, 3),
      },
    ];
    const result = await provider.chat(messages, { json: true, temperature: 0.1 });
    try {
      const parsed = extractJson(result.content);
      const data = productIdentifyAiSchema.parse(parsed);
      return {
        ...data,
        insufficientQuality: data.insufficientQuality ?? false,
      };
    } catch (error) {
      logger.warn("Product identify parse failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /** Optional free-form valuation JSON (mock/demo). Prefer ValuationEngine for numbers. */
  async rawValuationHint(payload: Record<string, unknown>): Promise<ValuationAi> {
    const { data } = await this.completeJson(
      VALUATION_SYSTEM_PROMPT,
      buildValuationUserPrompt(payload),
      valuationAiSchema,
    );
    return data;
  }
}

let singleton: AIService | null = null;

export function getAIService(): AIService {
  if (!singleton) {
    try {
      if (env.GEMINI_API_KEY) {
        singleton = new AIService(new GeminiProvider());
      } else {
        singleton = new AIService();
      }
    } catch {
      singleton = new AIService();
    }
  }
  return singleton;
}
