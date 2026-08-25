/**
 * Shared Gemini API fetch helper with automatic retry + exponential backoff.
 * Handles 429 (rate limit), 503 (overloaded), and "high demand" 500 errors.
 */
import { env } from "@/config/env";

// Try models in order — fall back if one is unavailable/overloaded
const MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1200;

function isRetryable(status: number, body: string): boolean {
  if (status === 429 || status === 503 || status === 502) return true;
  if (status === 500) {
    const lower = body.toLowerCase();
    return lower.includes("high demand") || lower.includes("overload") || lower.includes("temporarily");
  }
  return false;
}

function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status === 400) {
    const lower = body.toLowerCase();
    return lower.includes("no longer available") || lower.includes("not found") || lower.includes("does not exist");
  }
  return false;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiRequestBody = {
  systemInstruction?: { parts: { text: string }[] };
  contents: Array<{
    role: "user" | "model";
    parts: Array<
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    >;
  }>;
  generationConfig?: Record<string, unknown>;
};

export type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number; status?: string };
};

/**
 * Call Gemini with retry across models.
 * Returns the raw response text on success.
 * Throws on permanent failure.
 */
export async function callGemini(
  body: GeminiRequestBody,
  timeoutMs = 60_000,
): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  // Start with the configured model, then fall back
  const configuredModel = env.GEMINI_MODEL || "gemini-3.6-flash";
  const modelsToTry = [
    configuredModel,
    ...MODEL_FALLBACKS.filter((m) => m !== configuredModel),
  ];

  let lastError = "Unknown error";

  for (const model of modelsToTry) {
    const endpoint = `${BASE_URL}/${encodeURIComponent(model)}:generateContent`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1.2s, 2.4s, 4.8s
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const rawText = await res.text();

        // Model unavailable — skip to next model immediately
        if (isModelUnavailable(res.status, rawText)) {
          lastError = `Model ${model} unavailable (${res.status})`;
          break; // break retry loop, try next model
        }

        // Retryable error — wait and retry same model
        if (!res.ok && isRetryable(res.status, rawText)) {
          lastError = `Gemini ${model} overloaded (${res.status}), attempt ${attempt + 1}`;
          continue; // retry
        }

        // Parse JSON response
        let data: GeminiResponse;
        try {
          data = JSON.parse(rawText) as GeminiResponse;
        } catch {
          if (!res.ok) {
            lastError = `Gemini ${model} HTTP ${res.status}: ${rawText.slice(0, 200)}`;
            if (isRetryable(res.status, rawText)) continue;
            break;
          }
          throw new Error(`Gemini returned non-JSON: ${rawText.slice(0, 200)}`);
        }

        if (data.error) {
          const msg = data.error.message ?? `HTTP ${res.status}`;
          if (isModelUnavailable(res.status, msg)) {
            lastError = `Model ${model}: ${msg}`;
            break;
          }
          if (isRetryable(res.status, msg)) {
            lastError = msg;
            continue;
          }
          throw new Error(msg);
        }

        const content =
          data.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("")
            .trim() ?? "";

        if (!content) throw new Error("Gemini returned empty content");

        return content;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          lastError = `Gemini ${model} timed out`;
          break; // timeout — try next model
        }
        // Re-throw non-retryable errors
        if (attempt === MAX_RETRIES) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw new Error(`Gemini unavailable after trying all models. Last error: ${lastError}`);
}

/** Strip markdown fences, thinking tags, and extract the JSON object/array from any surrounding text. */
export function parseGeminiJson<T>(text: string): T {
  // Remove <thinking>...</thinking> and <thought>...</thought> blocks
  let cleaned = text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .trim();

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch { /* fall through */ }

  // Find the outermost { } block — handles preamble text like "Here is the JSON:"
  let depth = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        end = i;
        break;
      }
    }
  }
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch { /* fall through */ }
  }

  // Find the outermost [ ] block
  depth = 0; start = -1; end = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        end = i;
        break;
      }
    }
  }
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch { /* fall through */ }
  }

  throw new Error(`Could not extract JSON. Response preview: ${cleaned.slice(0, 300)}`);
}
