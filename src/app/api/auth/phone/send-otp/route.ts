import { z } from "zod";
import { handleRouteError, jsonBody } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sendPhoneOtp } from "@/lib/auth/phone-otp";

const schema = z.object({
  phone: z.string().min(8).max(20),
  purpose: z.enum(["login", "verify"]).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit({
      key: `auth:phone-otp:${request.headers.get("x-forwarded-for") ?? "local"}`,
      max: 8,
    });
    const body = schema.parse(await jsonBody(request));
    const result = await sendPhoneOtp({
      phoneRaw: body.phone,
      purpose: body.purpose,
    });
    return ok({
      phone: result.phone,
      expiresAt: result.expiresAt.toISOString(),
      message: "OTP sent to your mobile number. Valid for 10 minutes.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
