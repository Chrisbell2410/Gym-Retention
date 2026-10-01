import { Resend } from "resend";
import type { EmailProvider, SendEmailParams, SendEmailResult } from "./types";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend;

  constructor(
    apiKey: string,
    private readonly fromAddress: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
      replyTo: params.replyTo,
      headers: params.headers,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }

    return { providerMessageId: data!.id };
  }
}
