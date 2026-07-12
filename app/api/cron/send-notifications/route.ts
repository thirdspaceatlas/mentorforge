import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan, canUseFeature, recordUsage } from "@/lib/access";
import { sendPush, isSubscriptionGone } from "@/lib/push/vapid";
import { sendExpoPush } from "@/lib/push/expo";
import { buildNudgePayload } from "@/lib/plan/nudge/micro-dose";
import { recommendTopic } from "@/lib/plan/nudge/recommend-topic";
import { withRetry } from "@/lib/retry";

/**
 * GET /api/cron/send-notifications — fires Calendar Coach nudges for study windows
 * starting inside the next ~60 minutes. Runs every 5 min for near-real-time
 * delivery (Phase 3): when a meeting is cancelled, the 5-min sync regenerates a
 * fresh window and this job nudges within minutes rather than up to an hour later.
 *
 * Reliable-nudge rule (Phase 3): a nudge only fires when a micro-dose can be
 * RELIABLY generated. We use the window's own topic if set, otherwise recommend
 * one from the user's saved-plan timeline. If no reliable suggestion exists we
 * decline to nudge (and mark the window notified so we don't churn it).
 *
 * Cap semantics (Phase 1b): free users get 3 nudges per rolling 7 days.
 * If the cap is hit, we still mark the window `notified = true` so we don't
 * re-queue it later (the window has already passed the "send now" threshold).
 *
 * Auth: Bearer CRON_SECRET. Registered in vercel.json.
 */

const LOOKAHEAD_MS = 60 * 60 * 1000; // 60 min

function authorize(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const ts = () => new Date().toISOString();

  try {
    const now = new Date();
    const deadline = new Date(now.getTime() + LOOKAHEAD_MS);

    const windows = await withRetry(() =>
      prisma.studyWindow.findMany({
        where: {
          notified: false,
          startTime: { gte: now, lte: deadline },
        },
        orderBy: { startTime: "asc" },
      }),
    );

    console.log(
      JSON.stringify({
        event: "cron_notify_start",
        considered: windows.length,
        ts: ts(),
      }),
    );

    let sent = 0;
    let skippedCap = 0;
    let skippedNoSubscription = 0;
    let skippedUnreliable = 0;
    let removedDead = 0;
    const errors: { windowId: string; error: string }[] = [];

    const planCache = new Map<string, { planStartDate: string; examDate: string } | null>();
    async function getPlanDates(userId: string) {
      if (planCache.has(userId)) return planCache.get(userId)!;
      const plan = await prisma.savedStudyPlan.findUnique({
        where: { userId },
        select: { planStartDate: true, examDate: true },
      });
      const value = plan ? { planStartDate: plan.planStartDate, examDate: plan.examDate } : null;
      planCache.set(userId, value);
      return value;
    }

    for (const win of windows) {
      try {
        const userPlan = await getUserPlan(win.userId);
        const capCheck = await canUseFeature(win.userId, userPlan.plan, "nudge_sent");

        if (!capCheck.allowed) {
          await prisma.studyWindow.update({
            where: { id: win.id },
            data: { notified: true },
          });
          skippedCap++;
          continue;
        }

        const [subs, mobileTokens] = await Promise.all([
          prisma.pushSubscription.findMany({ where: { userId: win.userId } }),
          prisma.mobilePushToken.findMany({ where: { userId: win.userId } }),
        ]);
        if (subs.length === 0 && mobileTokens.length === 0) {
          await prisma.studyWindow.update({
            where: { id: win.id },
            data: { notified: true },
          });
          skippedNoSubscription++;
          continue;
        }

        const minutesUntil = Math.max(
          0,
          Math.round((win.startTime.getTime() - now.getTime()) / 60000),
        );

        let topicName = win.topicName;
        let studyType = win.studyType;
        if (!topicName) {
          const plan = await getPlanDates(win.userId);
          if (plan) {
            const rec = recommendTopic({
              planStartDate: plan.planStartDate,
              examDate: plan.examDate,
              now,
            });
            if (rec) {
              topicName = rec.topicName;
              studyType = rec.studyType;
            }
          }
        }

        const payload = buildNudgePayload({
          windowId: win.id,
          minutesUntil,
          gapMinutes: win.durationMin,
          topicName,
          studyType,
        });

        if (!payload) {
          await prisma.studyWindow.update({
            where: { id: win.id },
            data: { notified: true },
          });
          skippedUnreliable++;
          continue;
        }

        let anyDelivered = false;
        for (const sub of subs) {
          try {
            await sendPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload,
            );
            anyDelivered = true;
          } catch (err) {
            if (isSubscriptionGone(err)) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
              removedDead++;
            } else {
              errors.push({
                windowId: win.id,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }

        if (mobileTokens.length > 0) {
          const results = await sendExpoPush(
            mobileTokens.map((t) => t.expoPushToken),
            {
              title: payload.title,
              body: payload.body,
              url: payload.url,
              data: { tag: payload.tag, actions: payload.actions },
            },
          );
          for (const r of results) {
            if (r.ok) {
              anyDelivered = true;
            } else if (r.removable) {
              await prisma.mobilePushToken
                .deleteMany({ where: { expoPushToken: r.token } })
                .catch(() => {});
              removedDead++;
            } else {
              errors.push({ windowId: win.id, error: `expo: ${r.error}` });
            }
          }
        }

        if (anyDelivered) {
          await prisma.studyWindow.update({
            where: { id: win.id },
            data: { notified: true, topicName, studyType },
          });
          await recordUsage(win.userId, "nudge_sent");
          sent++;
        }
      } catch (e) {
        errors.push({
          windowId: win.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const durationMs = Date.now() - startTime;

    console.log(
      JSON.stringify({
        event: "cron_notify_done",
        sent,
        skippedCap,
        errors: errors.length,
        durationMs,
        ts: ts(),
      }),
    );

    return NextResponse.json({
      ok: true,
      considered: windows.length,
      sent,
      skippedCap,
      skippedNoSubscription,
      skippedUnreliable,
      removedDead,
      durationMs,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        event: "cron_notify_error",
        error: message,
        ts: ts(),
      }),
    );
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
