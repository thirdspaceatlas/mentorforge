"use client";

import * as amplitude from "@amplitude/unified";
import { Logger, LogLevel } from "@amplitude/analytics-core";

let initPromise: Promise<void> | null = null;

/**
 * Downgrade known Amplitude SDK noise that Next.js surfaces as red Console Error
 * overlays. Does not change event delivery — see same-origin serverUrl proxy.
 */
class AmplitudeLogger extends Logger {
  error(...args: unknown[]): void {
    const msg = args.map(String).join(" ");
    if (
      msg.includes("Failed to generate joined config") ||
      msg.includes("No remote config received") ||
      msg.includes("Failed to fetch") ||
      msg.includes("Event rejected due to exceeded retry count")
    ) {
      super.debug(...args);
      return;
    }
    super.error(...args);
  }
}

const logger = new AmplitudeLogger();
logger.enable(LogLevel.Warn);

/**
 * Ensures Amplitude is initialized once for the client app lifecycle.
 * Safe to call from multiple components — concurrent callers share one promise.
 */
export function ensureAmplitude(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (initPromise) return initPromise;

  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!key) {
    console.warn("Amplitude API key missing — analytics disabled");
    initPromise = Promise.resolve();
    return initPromise;
  }

  initPromise = amplitude.initAll(key, {
    analytics: {
      autocapture: true,
      // Bypass ad blockers that strip api2.amplitude.com in local browsers.
      serverUrl: "/api/amplitude/httpapi",
      logLevel: LogLevel.Warn,
      loggerProvider: logger,
    },
    sessionReplay: {
      sampleRate: 1,
      logLevel: LogLevel.Warn,
      loggerProvider: logger,
    },
  });
  return initPromise;
}

/** Track after init so load-time events aren't dropped if effects race. */
export async function trackAmplitude(
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  await ensureAmplitude();
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return;
  const result = amplitude.track(event, properties);
  // Flush immediately so the Amplitude Setup checklist sees the event quickly.
  await amplitude.flush().promise;
  await result.promise;
}
