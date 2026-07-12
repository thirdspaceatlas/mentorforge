import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, type Signals } from "@/lib/insights/insights";

export type InsightBlurbs = { readiness: string; coachTip: string };

/** True when both Emergent gateway env vars are present. */
export function llmConfigured(): boolean {
  return Boolean(
    process.env.EMERGENT_LLM_KEY?.trim() && process.env.EMERGENT_LLM_BASE_URL?.trim(),
  );
}

/**
 * Attempt LLM-generated blurbs. Returns null when env is missing, the gateway
 * errors (401/5xx), or the response is not valid JSON with both fields.
 */
export async function tryLlmBlurbs(signals: Signals): Promise<InsightBlurbs | null> {
  const apiKey = process.env.EMERGENT_LLM_KEY?.trim();
  const baseURL = process.env.EMERGENT_LLM_BASE_URL?.trim();
  if (!apiKey || !baseURL) return null;

  try {
    const anthropic = new Anthropic({ apiKey, baseURL });
    const msg = await anthropic.messages.create({
      model: process.env.INSIGHTS_MODEL?.trim() || "claude-sonnet-5",
      max_tokens: 400,
      system: "Return STRICT JSON only. No markdown.",
      messages: [{ role: "user", content: buildPrompt(signals) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    const parsed = JSON.parse(text) as { readiness?: unknown; coachTip?: unknown };
    if (typeof parsed.readiness === "string" && typeof parsed.coachTip === "string") {
      return { readiness: parsed.readiness, coachTip: parsed.coachTip };
    }
    return null;
  } catch {
    return null;
  }
}
