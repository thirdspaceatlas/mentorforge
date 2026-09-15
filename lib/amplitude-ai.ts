import AnthropicSDK from "@anthropic-ai/sdk";
import { AmplitudeAI, AIConfig, Anthropic as AmplitudeAnthropic } from "@amplitude/ai";

const apiKey = process.env.AMPLITUDE_AI_API_KEY?.trim();

export const ai = apiKey
  ? new AmplitudeAI({
      apiKey,
      config: new AIConfig({
        contentMode: "full",
        redactPii: true,
      }),
    })
  : null;

/** Module-level singleton — do not recreate inside request handlers. */
export const insightsAgent = ai
  ? ai.agent("insights-blurbs", {
      description:
        "Generates CFA study readiness and coach-tip blurbs for the Home screen",
    })
  : null;

/**
 * Anthropic client instrumented for Agent Analytics.
 * Sets baseURL after wrap so the Emergent gateway hop is preserved
 * (Amplitude's Anthropic constructor does not accept baseURL).
 */
export function createInstrumentedAnthropic(llmApiKey: string, baseURL: string) {
  if (!ai) {
    return new AnthropicSDK({ apiKey: llmApiKey, baseURL });
  }
  const wrapped = new AmplitudeAnthropic({
    apiKey: llmApiKey,
    amplitude: ai,
    anthropicModule: AnthropicSDK,
  });
  wrapped.client.baseURL = baseURL;
  return wrapped;
}
