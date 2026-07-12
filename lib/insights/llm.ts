import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, type Signals } from "@/lib/insights/insights";

export type InsightBlurbs = { readiness: string; coachTip: string };

const DEFAULT_INSIGHTS_MODEL = "claude-sonnet-4-5";

/** True when both Emergent gateway env vars are present. */
export function llmConfigured(): boolean {
  return Boolean(
    process.env.EMERGENT_LLM_KEY?.trim() && process.env.EMERGENT_LLM_BASE_URL?.trim(),
  );
}

/** Parse model output into insight blurbs; handles markdown fences and leading prose. */
export function parseInsightBlurbsFromText(text: string): InsightBlurbs | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let jsonStr = cleaned;
  try {
    JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];
  }
  try {
    const parsed = JSON.parse(jsonStr) as { readiness?: unknown; coachTip?: unknown };
    if (typeof parsed.readiness === "string" && typeof parsed.coachTip === "string") {
      return { readiness: parsed.readiness, coachTip: parsed.coachTip };
    }
    return null;
  } catch {
    return null;
  }
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
      model: process.env.INSIGHTS_MODEL?.trim() || DEFAULT_INSIGHTS_MODEL,
      max_tokens: 400,
      system: "Return STRICT JSON only. No markdown.",
      messages: [{ role: "user", content: buildPrompt(signals) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    return parseInsightBlurbsFromText(text);
  } catch {
    return null;
  }
}
