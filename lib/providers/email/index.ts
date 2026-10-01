import { MockEmailProvider } from "./mock";
import { ResendEmailProvider } from "./resend";
import type { EmailProvider } from "./types";

export type { EmailProvider } from "./types";
export * from "./types";

let cached: EmailProvider | null = null;

/**
 * Returns the configured EmailProvider. Defaults to the mock whenever
 * RESEND_API_KEY or OUTREACH_FROM_EMAIL isn't set, so local dev and tests
 * never accidentally send real mail to a real studio.
 */
export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.OUTREACH_FROM_EMAIL;

  if (apiKey && fromAddress) {
    cached = new ResendEmailProvider(apiKey, fromAddress);
  } else {
    cached = new MockEmailProvider();
  }
  return cached;
}
