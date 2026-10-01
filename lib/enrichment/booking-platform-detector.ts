/**
 * Detects a studio's booking platform by scanning their website's raw HTML
 * for known embed scripts / iframe hosts / link patterns. Deterministic
 * regex matching, not AI — booking platforms don't change their embed
 * markup often, and a wrong guess here is cheap to spot-check manually, so
 * there's no reason to spend an AI call on it.
 *
 * Always stored with a manual-override flag (see `studios.booking_platform_source`)
 * since this is a best-effort guess, not a certainty.
 */

export type BookingPlatform =
  | "mindbody"
  | "momence"
  | "mariana_tek"
  | "walla"
  | "glofox"
  | "wellnessliving"
  | "arketa"
  | "vagaro"
  | "zen_planner"
  | "pushpress"
  | "unknown";

const SIGNATURES: Record<Exclude<BookingPlatform, "unknown">, RegExp[]> = {
  mindbody: [/mindbodyonline\.com/i, /healcode\.com/i, /widgets\.mindbody/i],
  momence: [/momence\.com/i],
  mariana_tek: [/marianatek\.com/i],
  walla: [/hellowalla\.com|walla\.io/i],
  glofox: [/glofox\.com/i],
  wellnessliving: [/wellnessliving\.com/i],
  arketa: [/arketa\.co/i],
  vagaro: [/vagaro\.com/i],
  zen_planner: [/zenplanner\.com/i],
  pushpress: [/pushpress\.com/i],
};

export function detectBookingPlatformFromHtml(html: string): BookingPlatform {
  for (const [platform, patterns] of Object.entries(SIGNATURES) as [
    Exclude<BookingPlatform, "unknown">,
    RegExp[],
  ][]) {
    if (patterns.some((p) => p.test(html))) {
      return platform;
    }
  }
  return "unknown";
}

/** Fetches a studio's homepage and detects its booking platform. */
export async function detectBookingPlatformFromUrl(
  websiteUrl: string,
): Promise<BookingPlatform> {
  try {
    const res = await fetch(websiteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StudioSparkBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    return detectBookingPlatformFromHtml(html);
  } catch {
    return "unknown";
  }
}
