import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import type { AIGenerateOptions, AIProvider, AIResult, ChatMessage } from "./types";

type GeminiPart = {
  text?: string;
  inline_data?: { mime_type: string; data: string };
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number; status?: string };
};

/**
 * Google Gemini AI provider (Generative Language API).
 * Uses GEMINI_API_KEY from env. Supports text + optional base64 images.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly defaultTimeoutMs: number;
  private readonly baseUrl: string;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    baseUrl?: string;
  }) {
    this.apiKey = options?.apiKey ?? env.GEMINI_API_KEY;
    this.defaultModel = options?.model ?? env.GEMINI_MODEL;
    this.defaultTimeoutMs = options?.timeoutMs ?? env.AI_TIMEOUT_MS;
    this.baseUrl = (
      options?.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"
    ).replace(/\/$/, "");
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(
        `${this.baseUrl}/models?key=${encodeURIComponent(this.apiKey)}`,
        { method: "GET", signal: controller.signal },
      );
      clearTimeout(timer);
      return res.ok;
    } catch {
      // Key present — still allow attempts; network may be temporarily down
      return Boolean(this.apiKey);
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: AIGenerateOptions,
  ): Promise<AIResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = options?.model ?? this.defaultModel;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const systemParts = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .filter(Boolean);
    const systemInstruction =
      systemParts.length > 0
        ? { parts: [{ text: systemParts.join("\n\n") }] }
        : undefined;

    const contents: GeminiContent[] = [];
    for (const message of messages) {
      if (message.role === "system") continue;
      const role: "user" | "model" = message.role === "assistant" ? "model" : "user";
      const parts: GeminiPart[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const image of message.images ?? []) {
        const data = image.includes(",") ? image.split(",").pop()! : image;
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data,
          },
        });
      }
      if (parts.length === 0) continue;

      // Gemini requires alternating user/model; merge consecutive same roles
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts.push(...parts);
      } else {
        contents.push({ role, parts });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Respond with valid JSON." }] });
    }
    // First content must be user
    if (contents[0]?.role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Continue." }] });
    }

    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.2,
      ...(options?.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
      // Disable thinking mode — prevents JSON being wrapped in thought blocks
      thinkingConfig: { thinkingBudget: 0 },
      // Do NOT set responseMimeType — newer models with thinking return non-JSON
      // when forced into JSON mode. We extract JSON from text instead.
    };

    try {
      const endpoint = `${this.baseUrl}/models/${encodeURIComponent(model)}:generateContent`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          ...(systemInstruction ? { systemInstruction } : {}),
          generationConfig,
        }),
      });

      const data = (await res.json()) as GeminiResponse;
      if (!res.ok || data.error) {
        throw new Error(
          data.error?.message || `Gemini request failed (${res.status})`,
        );
      }

      const content =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? "";

      if (!content) {
        throw new Error("Gemini returned empty content");
      }

      return {
        content,
        model,
        provider: this.name,
      };
    } catch (error) {
      logger.warn("Gemini chat request failed", {
        error: error instanceof Error ? error.message : String(error),
        model,
      });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async complete(prompt: string, options?: AIGenerateOptions): Promise<AIResult> {
    return this.chat([{ role: "user", content: prompt }], options);
  }
}
