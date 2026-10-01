import { DEFAULT_MODEL, getClaudeClient } from "./claude";

/**
 * Drafts a cold email + 3-touch follow-up sequence (day 3/7/14) for one
 * studio. Every draft lands in `outreach_drafts` with status "draft" —
 * nothing here ever sends anything; the UI (Phase 1, item 6) is what lets
 * Chris review, edit, and approve before a send happens.
 */

const VOICE_GUIDE = `
Write like Chris Bell: direct, local (Charleston, SC), fitness-insider, no hype or
corporate marketing-speak. Short sentences. No exclamation-point enthusiasm. No
"I hope this email finds you well." Reference something specific and true about
the studio — not a generic compliment. Never invent a stat or claim that isn't
in the provided secret-shop data.
`.trim();

export interface ColdEmailInput {
  studioName: string;
  neighborhood: string;
  category: string;
  /** Plain-language summary of what the secret shop found, e.g. "Took 29 hours to reply to our Instagram DM, never followed up." */
  secretShopSummary: string;
  charlestonMedianResponseTime: string;
}

export interface DraftedEmail {
  subject: string;
  body: string;
}

export interface FollowUpSequence {
  day3: DraftedEmail;
  day7: DraftedEmail;
  day14: DraftedEmail;
}

async function askClaude(prompt: string): Promise<string> {
  const client = getClaudeClient();
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

function parseSubjectBody(raw: string): DraftedEmail {
  const subjectMatch = raw.match(/^Subject:\s*(.+)$/im);
  const subject = subjectMatch?.[1]?.trim() ?? "";
  const body = raw.replace(/^Subject:\s*.+$/im, "").trim();
  return { subject, body };
}

export async function draftColdEmail(
  input: ColdEmailInput,
): Promise<DraftedEmail> {
  const prompt = `${VOICE_GUIDE}

Write a short cold email (under 120 words) to the owner of ${input.studioName},
a ${input.category} studio in ${input.neighborhood}, Charleston, SC.

What we found when we secret-shopped them: ${input.secretShopSummary}
Charleston median response time for comparison: ${input.charlestonMedianResponseTime}

Goal: get a 15-minute call booked to show them the Response Time Report. Don't
pitch price or features — just the finding and the offer to show them the
report. Respond in this exact format:

Subject: <subject line>

<email body>`;

  const raw = await askClaude(prompt);
  return parseSubjectBody(raw);
}

export async function draftFollowUpSequence(
  input: ColdEmailInput,
  initialEmail: DraftedEmail,
): Promise<FollowUpSequence> {
  const prompt = `${VOICE_GUIDE}

We sent this cold email to ${input.studioName} and got no reply:

Subject: ${initialEmail.subject}
${initialEmail.body}

Write 3 short follow-up emails (day 3, day 7, day 14), each shorter than the
last, each adding a small new angle rather than just "just bumping this up."
Day 14 should be a graceful break-up email. Respond in this exact format,
repeated 3 times:

### Day 3
Subject: <subject>
<body>

### Day 7
Subject: <subject>
<body>

### Day 14
Subject: <subject>
<body>`;

  const raw = await askClaude(prompt);
  const sections = raw.split(/###\s*Day\s*(3|7|14)/i);
  // sections[0] is preamble before first match; then alternating [dayNum, content]
  const byDay: Record<string, string> = {};
  for (let i = 1; i < sections.length; i += 2) {
    byDay[sections[i].trim()] = sections[i + 1] ?? "";
  }

  return {
    day3: parseSubjectBody(byDay["3"] ?? ""),
    day7: parseSubjectBody(byDay["7"] ?? ""),
    day14: parseSubjectBody(byDay["14"] ?? ""),
  };
}
