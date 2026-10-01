import { MockSmsProvider } from "./mock";
import { OpenPhoneProvider } from "./openphone";
import type { SmsProvider } from "./types";

export type { SmsProvider } from "./types";
export * from "./types";

let cached: SmsProvider | null = null;

/**
 * Returns the configured SmsProvider. Defaults to the mock in any
 * environment that doesn't have OpenPhone credentials set, so local dev
 * and tests never accidentally send a real text.
 */
export function getSmsProvider(): SmsProvider {
  if (cached) return cached;

  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_FROM_NUMBER;
  const signingSecret = process.env.OPENPHONE_WEBHOOK_SIGNING_SECRET;

  if (apiKey && fromNumber) {
    cached = new OpenPhoneProvider(apiKey, fromNumber, signingSecret ?? "");
  } else {
    cached = new MockSmsProvider();
  }
  return cached;
}
