export interface SendEmailParams {
  to: string;
  subject: string;
  /** Plain text body — always required (good deliverability, and keeps the
   * CreateEmailOptions union on the Resend SDK happy without a runtime check). */
  text: string;
  /** Optional HTML version, in addition to the required plain text. */
  html?: string;
  replyTo?: string;
  /** Headers like List-Unsubscribe for CAN-SPAM compliance. */
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  providerMessageId: string;
}

export interface EmailProvider {
  readonly name: string;
  send(params: SendEmailParams): Promise<SendEmailResult>;
}
