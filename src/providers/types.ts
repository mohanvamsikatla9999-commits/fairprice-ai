export type ProviderName =
  | "ai"
  | "email"
  | "sms"
  | "storage"
  | "payment"
  | "maps";

export type ProviderKind = "mock" | "local" | "ollama" | "auto";

export type ProviderMeta = {
  name: ProviderName;
  kind: ProviderKind;
  healthy: boolean;
};
