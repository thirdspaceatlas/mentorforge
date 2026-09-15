import { describe, it, expect } from "vitest";
import {
  AIConfig,
  PROP_SESSION_ID,
  PROP_MODEL_NAME,
  PROP_PROVIDER,
  PROP_LATENCY_MS,
  PROP_INPUT_TOKENS,
  PROP_OUTPUT_TOKENS,
  PROP_COST_USD,
} from "@amplitude/ai";
import { MockAmplitudeAI } from "@amplitude/ai/testing";

describe("Amplitude Agent Analytics verify", () => {
  it("insights-blurbs agent emits a closed session with data-quality fields", async () => {
    const mock = new MockAmplitudeAI(new AIConfig({ contentMode: "full" }));
    const agent = mock.agent("insights-blurbs", { userId: "u1" });

    await agent.session({ sessionId: "s1" }).run(async (s) => {
      s.trackUserMessage("Generate readiness and coach tip blurbs");
      s.trackAiMessage(
        '{"readiness":"On pace.","coachTip":"Focus Ethics."}',
        "claude-sonnet-4-20250514",
        "anthropic",
        150,
        { inputTokens: 40, outputTokens: 60, totalCostUsd: 0.002 },
      );
    });

    mock.assertEventTracked("[Agent] User Message", { userId: "u1" });
    mock.assertSessionClosed("s1");

    const aiEvents = mock.getEvents("[Agent] AI Response");
    expect(aiEvents.length).toBeGreaterThan(0);
    for (const e of aiEvents) {
      const p = e.event_properties ?? {};
      expect(e.user_id || e.device_id).toBeTruthy();
      expect(p[PROP_SESSION_ID]).toBeTruthy();
      expect(p[PROP_MODEL_NAME]).toBeTruthy();
      expect(p[PROP_PROVIDER]).toBeTruthy();
      expect(p[PROP_LATENCY_MS]).toBeGreaterThan(0);
      expect(p[PROP_INPUT_TOKENS]).toBeGreaterThan(0);
      expect(p[PROP_OUTPUT_TOKENS]).toBeGreaterThan(0);
      expect(p[PROP_COST_USD]).toBeDefined();
    }
  });
});
