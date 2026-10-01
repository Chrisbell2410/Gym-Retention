import type { EmailProvider, SendEmailParams, SendEmailResult } from "./types";

/** In-memory EmailProvider for tests and local dev. Never calls a real API. */
export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  public sentMessages: SendEmailParams[] = [];

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    this.sentMessages.push(params);
    return { providerMessageId: `mock_${this.sentMessages.length}` };
  }
}
