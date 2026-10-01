import type {
  IncomingSms,
  SendSmsParams,
  SendSmsResult,
  SmsProvider,
} from "./types";

/** In-memory SmsProvider for tests and local dev. Never calls a real API. */
export class MockSmsProvider implements SmsProvider {
  readonly name = "mock";
  public sentMessages: SendSmsParams[] = [];

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    this.sentMessages.push(params);
    return {
      providerMessageId: `mock_${this.sentMessages.length}`,
      status: "sent",
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  parseIncomingWebhook(payload: unknown): IncomingSms {
    return payload as IncomingSms;
  }
}
