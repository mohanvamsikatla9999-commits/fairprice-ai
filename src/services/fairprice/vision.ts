import { z } from "zod";
import { getAIService } from "@/lib/ai/service";
import { attributedValueSchema, type AttributedValue } from "./schemas";

const visionResultSchema = z.object({
  category: attributedValueSchema.optional(),
  subcategory: attributedValueSchema.optional(),
  brand: attributedValueSchema.optional(),
  model: attributedValueSchema.optional(),
  variant: attributedValueSchema.optional(),
  storage: attributedValueSchema.optional(),
  ram: attributedValueSchema.optional(),
  color: attributedValueSchema.optional(),
  year: attributedValueSchema.optional(),
  visibleCondition: attributedValueSchema.optional(),
  visibleDamage: z.array(z.string()).optional(),
  accessories: z.array(z.string()).optional(),
  ocrText: z.array(z.string()).optional(),
  uncertainty: z.array(z.string()).optional(),
});

export type VisionAnalysis = z.infer<typeof visionResultSchema>;

export interface VisionProvider {
  readonly name: string;
  analyzeProductImages(input: {
    images?: Array<{ url?: string; base64?: string; mimeType?: string }>;
    titleHint?: string;
    descriptionHint?: string;
    categorySlug?: string;
  }): Promise<VisionAnalysis>;
}

function nullAttr(): AttributedValue {
  return { value: null, confidence: 0, source: "unknown" };
}

/**
 * Vision via existing AI identify path. Returns nulls when uncertain — never forces guesses.
 */
export class AiVisionProvider implements VisionProvider {
  readonly name = "ai-vision";

  async analyzeProductImages(input: {
    images?: Array<{ url?: string; base64?: string; mimeType?: string }>;
    titleHint?: string;
    descriptionHint?: string;
    categorySlug?: string;
  }): Promise<VisionAnalysis> {
    if (!input.images?.length && !input.titleHint) {
      return {
        brand: nullAttr(),
        model: nullAttr(),
        uncertainty: ["No images or title provided"],
      };
    }

    try {
      const ai = getAIService();
      const imagesBase64 = input.images
        ?.map((i) => i.base64)
        .filter((b): b is string => Boolean(b));
      const identified = await ai.identifyProduct({
        hint: [input.titleHint, input.descriptionHint].filter(Boolean).join(" — "),
        categorySlug: input.categorySlug,
        imagesBase64,
      });

      if (identified.insufficientQuality) {
        return {
          brand: nullAttr(),
          model: nullAttr(),
          uncertainty: ["Image quality insufficient for reliable identification"],
        };
      }

      const conf = identified.confidence ?? 0.7;

      return visionResultSchema.parse({
        brand: {
          value: identified.brand || null,
          confidence: identified.brand ? conf : 0,
          source: identified.brand ? "image" : "unknown",
        },
        model: {
          value: identified.model || null,
          confidence: identified.model ? conf * 0.95 : 0,
          source: identified.model ? "image" : "unknown",
        },
        category: {
          value: identified.categorySlug || null,
          confidence: identified.categorySlug ? 0.75 : 0,
          source: "inference",
        },
        storage: {
          value: identified.storage ?? null,
          confidence: identified.storage ? 0.8 : 0,
          source: identified.storage ? "ocr" : "unknown",
        },
        color: {
          value: identified.color ?? null,
          confidence: identified.color ? 0.7 : 0,
          source: identified.color ? "image" : "unknown",
        },
        variant: {
          value: identified.storage ?? null,
          confidence: identified.storage ? 0.7 : 0,
          source: "inference",
        },
        uncertainty: identified.notes ? [identified.notes] : [],
      });
    } catch {
      return {
        brand: nullAttr(),
        model: nullAttr(),
        uncertainty: ["Vision analysis unavailable"],
      };
    }
  }
}

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock-vision";

  async analyzeProductImages(input: {
    titleHint?: string;
  }): Promise<VisionAnalysis> {
    const hint = (input.titleHint ?? "").toLowerCase();
    if (hint.includes("iphone 15") && !hint.includes("pro")) {
      return {
        brand: { value: "Apple", confidence: 0.95, source: "image" },
        model: { value: "iPhone 15", confidence: 0.92, source: "image" },
        storage: {
          value: hint.includes("256") ? "256GB" : "128GB",
          confidence: 0.8,
          source: "ocr",
        },
        category: { value: "mobiles", confidence: 0.9, source: "inference" },
      };
    }
    return {
      brand: nullAttr(),
      model: nullAttr(),
      uncertainty: ["Mock vision: no match for title hint"],
    };
  }
}

let visionProvider: VisionProvider | null = null;

export function getVisionProvider(): VisionProvider {
  if (!visionProvider) visionProvider = new AiVisionProvider();
  return visionProvider;
}

export function setVisionProvider(provider: VisionProvider) {
  visionProvider = provider;
}
