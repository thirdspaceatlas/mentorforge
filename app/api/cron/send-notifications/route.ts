import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserPlan, canUseFeature, recordUsage } from "@/lib/access";
import { sendPush, isSubscriptionGone } from "@/lib/push/vapid";

/**
 * GET /api/cron/send-notifications — fires Calendar Coach nudges for study windows
 * starting inside the next ~60 minutes.
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

  const now = new Date();
  const deadline = new Date(now.getTime() + LOOKAHEAD_MS);

  const windows = await prisma.studyWindow.findMany({
    where: {
      notified: false,
      startTime: { gte: now, lte: deadline }
    },
    orderBy: { startTime: "asc" }
  });

  let sent = 0;
  let skippedCap = 0;
  let skippedNoSubscription = 0;
  let removedDead = 0;
  const errors: { windowId: string; error: string }[] = [];

  for (const win of windows) {
    try {
      const userPlan = await getUserPlan(win.userId);
      const capCheck = await canUseFeature(win.userId, userPlan.plan, "nudge_sent");

      if (!capCheck.allowed) {
        // Mark notified so we don't churn this window forever; we're out of nudges this week.
        await prisma.studyWindow.update({
          where: { id: win.id },
          data: { notified: true }
        });
        skippedCap++;
        continue;
      }

      const subs = await prisma.pushSubscription.findMany({
        where: { userId: win.userId }
      });
      if (subs.length === 0) {
        await prisma.studyWindow.update({
          where: { id: win.id },
          data: { notified: true }
        });
        skippedNoSubscription++;
        continue;
      }

      const minutesUntil = Math.max(
        0,
        Math.round((win.startTime.getTime() - now.getTime()) / 60000)
      );
      const topic = win.topicName ?? "Study window";
      const durationLabel = `${win.durationMin} min`;
      const title =
        minutesUntil <= 5
          ? `${durationLabel} window open now`
          : `${durationLabel} window in ${minutesUntil} min`;
      const body = topic;
      const payload = {
        title,
        body,
        url: "/app/today",
        tag: `window-${win.id}`
      };

      let anyDelivered = false;
      for (const sub of subs) {
        try {
          await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );
          anyDelivered = true;
        } catch (err) {
          if (isSubscriptionGone(err)) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            removedDead++;
          } else {
            errors.push({
              windowId: win.id,
              error: err instanceof Error ? err.message : String(err)
            });
          }
        }
      }

      if (anyDelivered) {
        await prisma.studyWindow.update({
          where: { id: win.id },
          data: { notified: true }
        });
        await recordUsage(win.userId, "nudge_sent");
        sent++;
      }
    } catch (e) {
      errors.push({
        windowId: win.id,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  }

  return NextResponse.json({
    ok: true,
    considered: windows.length,
    sent,
    skippedCap,
    skippedNoSubscription,
    removedDead,
    errors
  });
}
