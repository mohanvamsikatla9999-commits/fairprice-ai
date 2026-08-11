export type PaymentIntentInput = {
  amountInr: number;
  currency?: string;
  purpose: string;
  userId: string;
  metadata?: Record<string, unknown>;
};

export type PaymentIntent = {
  id: string;
  provider: string;
  amountInr: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  checkoutUrl?: string;
  providerRef: string;
};

export type CapturePaymentInput = {
  paymentId: string;
  providerRef?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
  capture(input: CapturePaymentInput): Promise<PaymentIntent>;
  refund(paymentId: string, amountInr?: number): Promise<PaymentIntent>;
}
