import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import type { EmailPayload, EmailProvider, EmailResult } from "./types";

export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async send(payload: EmailPayload): Promise<EmailResult> {
    const to = Array.isArray(payload.to) ? payload.to : [payload.to];
    const id = `mock_email_${nanoid(10)}`;
    logger.info("Mock email sent", {
      id,
      to,
      subject: payload.subject,
    });
    return {
      id,
      provider: this.name,
      accepted: to,
    };
  }
}
