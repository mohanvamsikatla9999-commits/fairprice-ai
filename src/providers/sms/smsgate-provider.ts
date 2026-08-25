/**
 * SMSGate provider for SMS Gateway for Android™
 * Docs: https://docs.sms-gate.app/features/sending-messages/
 *
 * .env config:
 *   SMS_PROVIDER=smsgate
 *   SMSGATE_URL=http://192.168.29.93:8080
 *   SMSGATE_USERNAME=sms
 *   SMSGATE_PASSWORD=your_password
 *   SMSGATE_SIM=1   (1 or 2 — which SIM slot; tries both automatically on failure)
 */
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { env } from "@/config/env";
import type { SmsPayload, SmsProvider, SmsResult } from "./types";

export class SMSGateProvider implements SmsProvider {
  readonly name = "smsgate";

  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly timeoutMs: number;
  private readonly preferredSim: number;

  constructor(options?: {
    baseUrl?: string;
    username?: string;
    password?: string;
    timeoutMs?: number;
    simNumber?: number;
  }) {
    this.baseUrl = (options?.baseUrl ?? env.SMSGATE_URL).replace(/\/$/, "");
    this.username = options?.username ?? env.SMSGATE_USERNAME;
    this.password = options?.password ?? env.SMSGATE_PASSWORD;
    this.timeoutMs = options?.timeoutMs ?? 20_000;
    this.preferredSim = options?.simNumber ?? Number(process.env.SMSGATE_SIM ?? "1");
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.username && this.password) {
      const token = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      headers["Authorization"] = `Basic ${token}`;
    }
    return headers;
  }

  private buildBody(payload: SmsPayload, simNumber: number): string {
    return JSON.stringify({
      textMessage: { text: payload.body },
      phoneNumbers: [payload.to],
      simNumber,
      priority: 100,       // bypass rate limits — critical for OTPs
      ttl: 600,            // expire after 10 min (matches OTP validity)
      withDeliveryReport: false,
    });
  }

  async send(payload: SmsPayload): Promise<SmsResult> {
    const id = `smsgate_${nanoid(10)}`;

    // Use only the configured SIM
    const simsToTry = [this.preferredSim];

    // This SMSGate instance uses the /message endpoint (not /3rdparty/v1/messages)
    const endpoints = [
      `${this.baseUrl}/message`,
      `${this.baseUrl}/3rdparty/v1/messages?skipPhoneValidation=true`,
    ];

    for (const endpoint of endpoints) {
      for (const simNumber of simsToTry) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: this.buildHeaders(),
            body: this.buildBody(payload, simNumber),
            signal: controller.signal,
          });

          // 202 Accepted = queued successfully; 200 OK also acceptable
          if (res.status === 202 || res.status === 200) {
            logger.info("SMSGate: message queued", {
              id, to: payload.to, sim: simNumber, endpoint,
            });
            return { id, provider: this.name, to: payload.to, status: "sent" };
          }

          // 404 means this endpoint doesn't exist — try next endpoint style
          if (res.status === 404) {
            clearTimeout(timer);
            break;
          }

          const text = await res.text().catch(() => "");
          logger.warn("SMSGate: send failed", {
            status: res.status, body: text.slice(0, 300),
            to: payload.to, sim: simNumber, endpoint,
          });
          // Try next SIM
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("abort") || msg.includes("ECONNREFUSED")) {
            logger.error("SMSGate: gateway unreachable", { error: msg, endpoint });
            // Gateway unreachable — skip remaining SIMs for this endpoint
            break;
          }
          logger.warn("SMSGate: request error", { error: msg, sim: simNumber });
        } finally {
          clearTimeout(timer);
        }
      }
    }

    logger.error("SMSGate: all attempts failed", { to: payload.to });
    return { id, provider: this.name, to: payload.to, status: "failed" };
  }
}
