import { env } from "@/config/env";
import { MockSmsProvider } from "./mock-sms-provider";
import { SMSGateProvider } from "./smsgate-provider";
import type { SmsProvider } from "./types";

export type { SmsPayload, SmsProvider, SmsResult } from "./types";
export { MockSmsProvider } from "./mock-sms-provider";
export { SMSGateProvider } from "./smsgate-provider";

export function createSmsProvider(): SmsProvider {
  switch (env.SMS_PROVIDER) {
    case "smsgate":
      return new SMSGateProvider();
    case "mock":
    default:
      return new MockSmsProvider();
  }
}
