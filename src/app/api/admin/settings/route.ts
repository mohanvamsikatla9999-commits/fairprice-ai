import { requireCurrentPermission } from "@/lib/auth/middleware";
import { handleRouteError } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { env } from "@/config/env";

// Keys to expose to admin — never expose raw secrets, only masked/status
const SAFE_KEYS: (keyof typeof env)[] = [
  "AI_PROVIDER",
  "GEMINI_MODEL",
  "GEMINI_API_KEY",
  "AI_TIMEOUT_MS",
  "SMS_PROVIDER",
  "SMSGATE_URL",
  "SMSGATE_USERNAME",
  "SMSGATE_SIM",
  "AUTH_SECRET",
  "AUTH_SESSION_DAYS",
  "FACE_VERIFICATION_AT_SIGNIN",
  "MOCK_IDENTITY_VERIFICATION",
  "STORAGE_PROVIDER",
  "STORAGE_LOCAL_PATH",
  "PAYMENT_PROVIDER",
  "NODE_ENV",
];

export async function GET() {
  try {
    await requireCurrentPermission("admin:access");

    const config: Record<string, string> = {};
    for (const key of SAFE_KEYS) {
      const val = String(env[key] ?? "");
      config[key] = val;
    }

    return ok({ config });
  } catch (error) {
    return handleRouteError(error);
  }
}
