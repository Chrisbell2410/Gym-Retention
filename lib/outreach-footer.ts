/**
 * CAN-SPAM-required footer for every cold outreach email: a working
 * unsubscribe mechanism and the sender's physical mailing address. Server
 * only (reads process.env directly) — build the footer in a server
 * component/action and pass the result down as a prop if a client
 * component needs to preview it.
 */
import { BUSINESS_NAME } from "@/lib/outreach-config";

/** Not set until Chris adds it — see .env.example. Sending is blocked
 * without one (see lib/actions/outreach.ts's sendOutreachDraft). */
export function getBusinessMailingAddress(): string | null {
  return process.env.BUSINESS_MAILING_ADDRESS?.trim() || null;
}

function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** A real outreach email's unsubscribe link has to actually be reachable
 * by whoever receives it — a localhost URL would be broken (and a broken
 * unsubscribe link is itself a CAN-SPAM problem, not just an embarrassing
 * one). Sending is blocked until APP_URL points somewhere real. */
export function isAppUrlConfiguredForSending(): boolean {
  const url = process.env.APP_URL?.trim();
  return Boolean(url) && !url!.includes("localhost");
}

export function buildUnsubscribeUrl(studioId: string, email: string): string {
  const url = new URL(`${getAppUrl()}/unsubscribe`);
  url.searchParams.set("studio", studioId);
  url.searchParams.set("email", email);
  return url.toString();
}

export function buildCanSpamFooterText(
  unsubscribeUrl: string,
  address: string,
): string {
  return [
    "",
    "—",
    `${BUSINESS_NAME} · ${address}`,
    `Don't want these emails? Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}
