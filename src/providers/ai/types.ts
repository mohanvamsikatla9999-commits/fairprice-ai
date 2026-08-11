export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  /** Optional base64 image payloads for vision models (Ollama). */
  images?: string[];
};

export type AIGenerateOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  json?: boolean;
};

export type AIResult = {
  content: string;
  model: string;
  provider: string;
};

export interface AIProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options?: AIGenerateOptions): Promise<AIResult>;
  complete(prompt: string, options?: AIGenerateOptions): Promise<AIResult>;
  isAvailable(): Promise<boolean>;
}
