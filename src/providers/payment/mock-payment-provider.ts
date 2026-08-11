import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import type {
  CapturePaymentInput,
  PaymentIntent,
  PaymentIntentInput,
  PaymentProvider,
} from "./types";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  private readonly intents = new Map<string, PaymentIntent>();

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntent> {
    const id = `pay_${nanoid(12)}`;
    const intent: PaymentIntent = {
      id,
      provider: this.name,
      amountInr: input.amountInr,
      currency: input.currency ?? "INR",
      status: "pending",
      providerRef: `mock_ref_${nanoid(8)}`,
      checkoutUrl: `/checkout/mock/${id}`,
    };
    this.intents.set(id, intent);
    logger.info("Mock payment intent created", {
      id,
      amountInr: input.amountInr,
      purpose: input.purpose,
      userId: input.userId,
    });
    return intent;
  }

  async capture(input: CapturePaymentInput): Promise<PaymentIntent> {
    const existing = this.intents.get(input.paymentId);
    const updated: PaymentIntent = {
      ...(existing ?? {
        id: input.paymentId,
        provider: this.name,
        amountInr: 0,
        currency: "INR",
        providerRef: input.providerRef ?? `mock_ref_${nanoid(8)}`,
      }),
      status: "completed",
    };
    this.intents.set(input.paymentId, updated);
    logger.info("Mock payment captured", { id: input.paymentId });
    return updated;
  }

  async refund(paymentId: string, amountInr?: number): Promise<PaymentIntent> {
    const existing = this.intents.get(paymentId);
    const updated: PaymentIntent = {
      ...(existing ?? {
        id: paymentId,
        provider: this.name,
        amountInr: amountInr ?? 0,
        currency: "INR",
        providerRef: `mock_ref_${nanoid(8)}`,
      }),
      status: "refunded",
      ...(amountInr !== undefined ? { amountInr } : {}),
    };
    this.intents.set(paymentId, updated);
    logger.info("Mock payment refunded", { id: paymentId, amountInr });
    return updated;
  }
}
