import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import type { AIGenerateOptions, AIProvider, AIResult, ChatMessage } from "./types";

type OllamaChatResponse = {
  model?: string;
  message?: { role?: string; content?: string };
  response?: string;
  error?: string;
};

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultTimeoutMs: number;

  constructor(options?: {
    baseUrl?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (options?.baseUrl ?? env.OLLAMA_BASE_URL).replace(/\/$/, "");
    this.defaultModel = options?.model ?? env.OLLAMA_MODEL;
    this.defaultTimeoutMs = options?.timeoutMs ?? env.AI_TIMEOUT_MS;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3_000);
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(
    messages: ChatMessage[],
    options?: AIGenerateOptions,
  ): Promise<AIResult> {
    const model = options?.model ?? this.defaultModel;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
            ...(options?.maxTokens ? { num_predict: options.maxTokens } : {}),
          },
          ...(options?.json ? { format: "json" } : {}),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Ollama chat failed (${res.status}): ${text || res.statusText}`);
      }

      const data = (await res.json()) as OllamaChatResponse;
      if (data.error) {
        throw new Error(`Ollama error: ${data.error}`);
      }

      const content = data.message?.content ?? data.response ?? "";
      if (!content) {
        throw new Error("Ollama returned empty content");
      }

      return {
        content,
        model: data.model ?? model,
        provider: this.name,
      };
    } catch (error) {
      logger.warn("Ollama chat request failed", {
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
