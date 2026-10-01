import type {
  IncomingSms,
  SendSmsParams,
  SendSmsResult,
  SmsProvider,
} from "./types";

/** Best-guess shape of an OpenPhone webhook payload — verify against the
 * current docs before relying on this in Phase 2 (see class comment below). */
interface RawOpenPhoneWebhook {
  data?: {
    object?: {
      from?: string;
      to?: string[];
      body?: string;
      content?: string;
      id?: string;
      createdAt?: string;
    };
  };
}

/**
 * OpenPhone implementation of SmsProvider.
 *
 * STATUS: structural stub for Phase 0/1 — Phase 1 never calls `send()`
 * (cold outreach is email-only; secret-shop inquiries go out by hand).
 * Before wiring this into Phase 2 (missed-call text-back, reminders),
 * double-check field names and the webhook signature scheme against
 * OpenPhone's current API docs (https://www.openphone.com/docs/api-reference) —
 * API shapes drift and this hasn't been exercised against a live account yet.
 */
export class OpenPhoneProvider implements SmsProvider {
  readonly name = "openphone";

  constructor(
    private readonly apiKey: string,
    private readonly fromNumber: string,
    private readonly webhookSigningSecret: string,
  ) {}

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    const res = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromNumber,
        to: [params.to],
        content: params.body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenPhone send failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return {
      providerMessageId: data.id ?? data.data?.id,
      status: "sent",
    };
  }

  verifyWebhookSignature(rawBody: string, headers: Headers): boolean {
    // TODO(phase 2): implement HMAC verification using
    // this.webhookSigningSecret against OpenPhone's documented header.
    // Returning false by default is intentional — fail closed, not open.
    void rawBody;
    void headers;
    return false;
  }

  parseIncomingWebhook(payload: unknown): IncomingSms {
    const p = payload as RawOpenPhoneWebhook;
    return {
      from: p.data?.object?.from ?? "",
      to: p.data?.object?.to?.[0] ?? "",
      body: p.data?.object?.body ?? p.data?.object?.content ?? "",
      providerMessageId: p.data?.object?.id ?? "",
      receivedAt: new Date(p.data?.object?.createdAt ?? Date.now()),
    };
  }
}
