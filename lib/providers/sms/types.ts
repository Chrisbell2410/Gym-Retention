/**
 * Provider-agnostic SMS interface. Phase 1 doesn't send any SMS (cold
 * outreach is email-only, secret-shop inquiries are sent by Chris by hand),
 * but Phase 2's speed-to-lead engine will need this — defining it now so
 * swapping OpenPhone for Twilio later is a new file, not a rewrite.
 */
export interface SendSmsParams {
  to: string; // E.164 format, e.g. +18435551234
  body: string;
  /** Idempotency key so retries don't double-send. */
  clientReference?: string;
}

export interface SendSmsResult {
  providerMessageId: string;
  status: "queued" | "sent" | "failed";
}

export interface IncomingSms {
  from: string;
  to: string;
  body: string;
  providerMessageId: string;
  receivedAt: Date;
}

export interface SmsProvider {
  /** Human-readable name, for logging. */
  readonly name: string;

  send(params: SendSmsParams): Promise<SendSmsResult>;

  /**
   * Verify an inbound webhook request actually came from the provider
   * (signature check) before trusting its payload.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Headers,
  ): boolean;

  /** Parse a verified webhook payload into a normalized shape. */
  parseIncomingWebhook(payload: unknown): IncomingSms;
}
