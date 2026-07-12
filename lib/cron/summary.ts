import { NextResponse } from "next/server";

export type CronSummary = {
  route: string;
  durationMs: number;
  processed: number;
  sent?: number;
  skippedCap?: number;
  skippedNoSubscription?: number;
  skippedUnreliable?: number;
  removedDead?: number;
  errorCount: number;
  [key: string]: string | number | undefined;
};

/** Log a single greppable JSON line and optionally alert on failures. */
export async function finishCronRun(
  summary: CronSummary,
  responseBody: Record<string, unknown>,
): Promise<NextResponse> {
  console.log(JSON.stringify(summary));

  const webhook = process.env.CRON_ALERT_WEBHOOK?.trim();
  if (webhook && summary.errorCount > 0) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...summary, ...responseBody }),
    }).catch((err) => {
      console.error(
        JSON.stringify({
          event: "cron_alert_webhook_failed",
          route: summary.route,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });
  }

  return NextResponse.json({ ...responseBody, summary });
}
