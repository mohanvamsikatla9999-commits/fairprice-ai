import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { createSmsProvider } from "@/providers/sms";
import { AppError, ValidationError } from "@/lib/api/errors";

const OTP_TTL_MS = 10 * 60 * 1000;
const PHONE_OTP_TYPE = "phone_otp";

export function normalizeIndiaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new ValidationError("Enter a valid 10-digit Indian mobile number");
}

function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

/**
 * Sends a 6-digit OTP via SMS provider. In mock mode the code is deterministic
 * for the phone in development logs only — never return the code to the client.
 */
export async function sendPhoneOtp(options: {
  phoneRaw: string;
  purpose?: "login" | "verify";
}): Promise<{ phone: string; expiresAt: Date }> {
  const phone = normalizeIndiaPhone(options.phoneRaw);
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Use a dedicated system user row orphan pattern: store against phone via
  // Verification.metadata when no user yet. We create/find a placeholder by phone.
  let user = await prisma.user.findFirst({
    where: { phone, deletedAt: null },
  });

  if (!user) {
    // Placeholder account for OTP login — email is synthetic until linked
    const syntheticEmail = `phone_${phone.replace(/\D/g, "")}@phone.fairprice.local`;
    user = await prisma.user.findFirst({ where: { email: syntheticEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: syntheticEmail,
          phone,
          authProvider: "phone",
          displayName: `User ${phone.slice(-4)}`,
          name: `User ${phone.slice(-4)}`,
          profile: { create: {} },
        },
      });
    }
  }

  await prisma.verification.updateMany({
    where: { userId: user.id, type: PHONE_OTP_TYPE, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.verification.create({
    data: {
      userId: user.id,
      type: PHONE_OTP_TYPE,
      tokenHash: hashOtp(phone, code),
      expiresAt,
      metadata: { phone, purpose: options.purpose ?? "login" },
    },
  });

  const sms = createSmsProvider();
  // Don't let SMS failure block OTP generation — the code is already in DB
  try {
    await sms.send({
      to: phone,
      body: `${code} is your FairPrice verification number. Expires in 10 mins.`,
    });
  } catch (smsErr) {
    console.warn(`[OTP] SMS delivery failed for ${phone}:`, smsErr instanceof Error ? smsErr.message : String(smsErr));
  }

  // Log OTP to server terminal only — never sent to client
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📱 [DEV OTP] Phone: ${phone} → Code: ${code}\n`);
  }

  return { phone, expiresAt };
}

export async function verifyPhoneOtp(options: {
  phoneRaw: string;
  code: string;
}): Promise<{ userId: string; phone: string; isNew: boolean }> {
  const phone = normalizeIndiaPhone(options.phoneRaw);
  const code = options.code.replace(/\D/g, "");
  if (code.length !== 6) throw new ValidationError("Enter the 6-digit OTP");

  const user = await prisma.user.findFirst({
    where: { phone, deletedAt: null },
  });
  if (!user) throw new AppError("OTP expired or invalid", 400, "OTP_INVALID");

  const tokenHash = hashOtp(phone, code);
  const record = await prisma.verification.findFirst({
    where: {
      userId: user.id,
      type: PHONE_OTP_TYPE,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) throw new AppError("OTP expired or invalid", 400, "OTP_INVALID");

  await prisma.verification.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  const wasUnverified = !user.phoneVerified;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      phoneVerified: new Date(),
      verificationLevel:
        user.verificationLevel === "BASIC" || user.verificationLevel === "EMAIL_VERIFIED"
          ? "PHONE_VERIFIED"
          : user.verificationLevel,
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  return { userId: user.id, phone, isNew: wasUnverified && !user.passwordHash };
}
