import { env } from "@/config/env";
import { MockPaymentProvider } from "./mock-payment-provider";
import type { PaymentProvider } from "./types";

export type {
  CapturePaymentInput,
  PaymentIntent,
  PaymentIntentInput,
  PaymentProvider,
} from "./types";
export { MockPaymentProvider } from "./mock-payment-provider";

export function createPaymentProvider(): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}
