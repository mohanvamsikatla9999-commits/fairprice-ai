export type EmailAddress = string;

export type EmailPayload = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  from?: EmailAddress;
  replyTo?: EmailAddress;
};

export type EmailResult = {
  id: string;
  provider: string;
  accepted: string[];
};

export interface EmailProvider {
  readonly name: string;
  send(payload: EmailPayload): Promise<EmailResult>;
}
