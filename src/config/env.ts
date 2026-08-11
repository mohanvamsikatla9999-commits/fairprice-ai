import { z } from "zod";

const boolFromString = z
  .union([z.boolean(), z.string()])
  .transform((v) => {
    if (typeof v === "boolean") return v;
    return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  });

const intFromString = (fallback: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return fallback;
      const n = typeof v === "number" ? v : Number.parseInt(v, 10);
      return Number.isFinite(n) ? n : fallback;
    });

const envSchema = z.object({
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/fairprice?schema=public"),
  AUTH_SECRET: z
    .string()
    .default("dev-auth-secret-change-me-in-production-32chars"),
  AUTH_SESSION_DAYS: intFromString(14),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().default(""),
  OLLAMA_BASE_URL: z.string().default("http://127.0.0.1:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2"),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
  AMAZON_ACCESS_KEY: z.string().default(""),
  AMAZON_SECRET_KEY: z.string().default(""),
  AMAZON_PARTNER_TAG: z.string().default(""),
  FLIPKART_AFFILIATE_TOKEN: z.string().default(""),
  FLIPKART_AFFILIATE_ID: z.string().default(""),
  AI_PROVIDER: z.enum(["auto", "ollama", "gemini", "mock"]).default("auto"),
  AI_TIMEOUT_MS: intFromString(30_000),
  STORAGE_PROVIDER: z.enum(["local", "mock"]).default("local"),
  PAYMENT_PROVIDER: z.enum(["mock"]).default("mock"),
  EMAIL_PROVIDER: z.enum(["mock"]).default("mock"),
  SMS_PROVIDER: z.enum(["mock"]).default("mock"),
  MAPS_PROVIDER: z.enum(["mock"]).default("mock"),
  STORAGE_LOCAL_PATH: z.string().default("./storage"),
  STORAGE_PUBLIC_URL: z.string().default("/uploads"),
  ADMIN_EMAIL: z.string().default("admin@fairprice.ai"),
  ADMIN_PASSWORD: z.string().default("FairPrice@Admin123"),
  DEMO_MODE: boolFromString.default(true),
  MOCK_IDENTITY_VERIFICATION: boolFromString.default(true),
  IDENTITY_VERIFICATION_PROVIDER: z.enum(["mock", "external"]).default("mock"),
  IDENTITY_WEBHOOK_SECRET: z.string().default("dev-idv-webhook-secret"),
  ALLOW_MOCK_IDV_IN_PRODUCTION: boolFromString.default(false),
  /** Require face + liveness after password/Google/phone sign-in. Default off for mass-market growth. */
  FACE_VERIFICATION_AT_SIGNIN: boolFromString.default(false),
  RATE_LIMIT_WINDOW_MS: intFromString(60_000),
  RATE_LIMIT_MAX: intFromString(100),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function readRawEnv(): Record<string, string | undefined> {
  return {
    APP_URL: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_SESSION_DAYS: process.env.AUTH_SESSION_DAYS,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
    AMAZON_ACCESS_KEY: process.env.AMAZON_ACCESS_KEY ?? process.env.AMAZON_PAAPI_ACCESS_KEY,
    AMAZON_SECRET_KEY: process.env.AMAZON_SECRET_KEY ?? process.env.AMAZON_PAAPI_SECRET_KEY,
    AMAZON_PARTNER_TAG: process.env.AMAZON_PARTNER_TAG,
    FLIPKART_AFFILIATE_TOKEN: process.env.FLIPKART_AFFILIATE_TOKEN,
    FLIPKART_AFFILIATE_ID: process.env.FLIPKART_AFFILIATE_ID,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    MAPS_PROVIDER: process.env.MAPS_PROVIDER,
    STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
    STORAGE_PUBLIC_URL: process.env.STORAGE_PUBLIC_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    DEMO_MODE: process.env.DEMO_MODE,
    MOCK_IDENTITY_VERIFICATION: process.env.MOCK_IDENTITY_VERIFICATION,
    IDENTITY_VERIFICATION_PROVIDER: process.env.IDENTITY_VERIFICATION_PROVIDER,
    IDENTITY_WEBHOOK_SECRET: process.env.IDENTITY_WEBHOOK_SECRET,
    ALLOW_MOCK_IDV_IN_PRODUCTION: process.env.ALLOW_MOCK_IDV_IN_PRODUCTION,
    FACE_VERIFICATION_AT_SIGNIN: process.env.FACE_VERIFICATION_AT_SIGNIN,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    NODE_ENV: process.env.NODE_ENV,
  };
}

function loadEnv(): Env {
  try {
    const parsed = envSchema.safeParse(readRawEnv());
    if (parsed.success) return parsed.data;

    // Soft-fail during build / missing optional vars — never throw
    const withDefaults = envSchema.parse({});
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[env] Using defaults for missing/invalid env vars:",
        parsed.error.flatten().fieldErrors,
      );
    }
    return {
      ...withDefaults,
      ...Object.fromEntries(
        Object.entries(readRawEnv()).filter(([, v]) => v !== undefined && v !== ""),
      ),
    } as Env;
  } catch (error) {
    console.warn(
      "[env] Falling back to hard defaults:",
      error instanceof Error ? error.message : String(error),
    );
    return envSchema.parse({});
  }
}

export const env: Env = loadEnv();

export function getEnv(): Env {
  return env;
}
