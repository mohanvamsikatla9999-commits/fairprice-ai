import { env } from "@/config/env";
import { MockEmailProvider } from "./mock-email-provider";
import type { EmailProvider } from "./types";

export type { EmailPayload, EmailProvider, EmailResult, EmailAddress } from "./types";
export { MockEmailProvider } from "./mock-email-provider";

export function createEmailProvider(): EmailProvider {
  switch (env.EMAIL_PROVIDER) {
    case "mock":
    default:
      return new MockEmailProvider();
  }
}
