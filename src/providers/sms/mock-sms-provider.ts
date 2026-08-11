import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import type { SmsPayload, SmsProvider, SmsResult } from "./types";

export class MockSmsProvider implements SmsProvider {
  readonly name = "mock";

  async send(payload: SmsPayload): Promise<SmsResult> {
    const id = `mock_sms_${nanoid(10)}`;
    logger.info("Mock SMS sent", {
      id,
      to: payload.to,
      bodyPreview: payload.body.slice(0, 80),
    });
    return {
      id,
      provider: this.name,
      to: payload.to,
      status: "sent",
    };
  }
}
