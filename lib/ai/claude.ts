import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cached;
}

/**
 * Default model for drafting tasks (outreach emails, etc.) — capable
 * enough for short, personalized copy without paying Opus-level prices for
 * high-volume drafting. Override via ANTHROPIC_MODEL if you want to try a
 * different tier.
 */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
