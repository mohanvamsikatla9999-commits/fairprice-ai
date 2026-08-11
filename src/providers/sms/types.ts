export type SmsPayload = {
  to: string;
  body: string;
  from?: string;
};

export type SmsResult = {
  id: string;
  provider: string;
  to: string;
  status: "queued" | "sent" | "failed";
};

export interface SmsProvider {
  readonly name: string;
  send(payload: SmsPayload): Promise<SmsResult>;
}
