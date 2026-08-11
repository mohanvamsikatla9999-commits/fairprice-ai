import { hashToken } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createEmailProvider } from "@/providers/email";
import { env } from "@/config/env";
import type { Prisma } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerificationToken(options: {
  userId: string;
  type: "email_verify" | "password_reset";
  hoursValid?: number;
  metadata?: Prisma.InputJsonValue;
}): Promise<string> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(
    Date.now() + (options.hoursValid ?? 24) * 60 * 60 * 1000,
  );

  await prisma.verification.create({
    data: {
      userId: options.userId,
      type: options.type,
      tokenHash: hashToken(token),
      expiresAt,
      metadata: options.metadata,
    },
  });

  return token;
}

export async function consumeVerificationToken(options: {
  token: string;
  type: "email_verify" | "password_reset";
}) {
  const tokenHash = hashToken(options.token);
  const record = await prisma.verification.findFirst({
    where: {
      tokenHash,
      type: options.type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
  if (!record) return null;

  await prisma.verification.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}

export async function sendAuthEmail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const email = createEmailProvider();
  await email.send({
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export function appUrl(path: string): string {
  const base = env.APP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `fp_${randomBytes(24).toString("hex")}`;
  return {
    raw,
    prefix: raw.slice(0, 10),
    hash: hashApiKey(raw),
  };
}
