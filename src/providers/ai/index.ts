import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { GeminiProvider } from "./gemini-provider";
import { MockAIProvider } from "./mock-ai-provider";
import { OllamaProvider } from "./ollama-provider";
import type { AIProvider } from "./types";

export type { AIProvider, AIResult, ChatMessage, AIGenerateOptions, ChatRole } from "./types";
export { MockAIProvider } from "./mock-ai-provider";
export { OllamaProvider } from "./ollama-provider";
export { GeminiProvider } from "./gemini-provider";

let cached: AIProvider | null = null;

export async function createAIProvider(force = false): Promise<AIProvider> {
  if (cached && !force) return cached;

  const preference = env.AI_PROVIDER;

  if (preference === "mock") {
    cached = new MockAIProvider();
    return cached;
  }

  // Explicit Gemini, or auto when key is present
  if (
    preference === "gemini" ||
    (preference === "auto" && Boolean(env.GEMINI_API_KEY))
  ) {
    const gemini = new GeminiProvider();
    try {
      const available = await gemini.isAvailable();
      if (available || preference === "gemini") {
        logger.info("Using Gemini AI provider", { model: env.GEMINI_MODEL });
        cached = gemini;
        return cached;
      }
    } catch (error) {
      logger.warn("Gemini availability check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (preference === "gemini" && env.GEMINI_API_KEY) {
        cached = gemini;
        return cached;
      }
    }
  }

  if (preference === "ollama" || preference === "auto") {
    const ollama = new OllamaProvider();
    try {
      const available = await ollama.isAvailable();
      if (available) {
        logger.info("Using Ollama AI provider", { model: env.OLLAMA_MODEL });
        cached = ollama;
        return cached;
      }
      if (preference === "ollama") {
        logger.warn("Ollama requested but unavailable; falling back to mock");
      }
    } catch (error) {
      logger.warn("Ollama connection check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Last resort: try Gemini if key exists even after ollama miss
  if (env.GEMINI_API_KEY && preference !== "ollama") {
    logger.info("Falling back to Gemini AI provider", { model: env.GEMINI_MODEL });
    cached = new GeminiProvider();
    return cached;
  }

  logger.info("Using mock AI provider");
  cached = new MockAIProvider();
  return cached;
}

export function getAIProviderSync(): AIProvider {
  return cached ?? new MockAIProvider();
}
