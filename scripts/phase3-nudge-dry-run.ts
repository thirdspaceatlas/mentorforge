/**
 * Phase 3 — SAFE, READ-ONLY dry-run of the reliable-nudge path.
 *
 * Exercises the EXACT logic the send-notifications cron uses:
 *   topic resolution (window.topicName ?? recommendTopic(savedPlan))
 *   -> buildNudgePayload (reliable-nudge rule)
 *   -> cap check (canUseFeature "nudge_sent", rolling 7 days)
 *
 * Guarantees ZERO side effects:
 *   - Only prisma reads (findUnique / findMany / count).
 *   - NEVER calls sendPush → no real push notifications.
 *   - NEVER writes study_windows / usage_events.
 *
 * It prints, per candidate window, exactly what the cron WOULD do. If the user
 * has no live upcoming windows right now, it also runs a few SYNTHETIC windows
 * (in-memory only) so you can see the decision matrix.
 *
 * Usage:
 *   npx tsx scripts/phase3-nudge-dry-run.ts                      # default email
 *   npx tsx scripts/phase3-nudge-dry-run.ts someone@example.com  # specific email
 */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { getUserPlan, canUseFeature, countUsageLast7Days, getCapsForPlan } from "@/lib/access";
import { buildNudgePayload } from "@/lib/plan/nudge/micro-dose";
import { recommendTopic } from "@/lib/plan/nudge/recommend-topic";

loadEnvConfig(process.cwd());

const DEFAULT_EMAIL = "david.blackwealth@pm.me";
const LOOKAHEAD_MS = 60 * 60 * 1000;

const prisma = new PrismaClient();

type WinLike = {
  id: string;
  startTime: Date;
  endTime: Date;
  durationMin: number;
  topicName: string | null;
  studyType: string | null;
  synthetic?: boolean;
};

function line() {
  console.log("─".repeat(72));
}

async function main() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim();
  const now = new Date();
  const deadline = new Date(now.getTime() + LOOKAHEAD_MS);

  const profile = await prisma.profile.findFirst({ where: { email } });
  if (!profile) {
    console.error(`No Profile found for ${email}.`);
    return;
  }
  const userId = profile.id;

  console.log(`\nPHASE 3 NUDGE DRY-RUN (read-only)`);
  console.log(`User:   ${email}  (${userId})`);
  console.log(`Now:    ${now.toISOString()}`);
  console.log(`Window: next 60 min (<= ${deadline.toISOString()})`);
  line();

  // --- plan snapshot (for the recommender) ---
  const plan = await prisma.savedStudyPlan.findUnique({
    where: { userId },
    select: { planStartDate: true, examDate: true, weeklyHours: true },
  });
  if (plan) {
    console.log(`Saved plan: start=${plan.planStartDate}  exam=${plan.examDate}  weeklyHours=${plan.weeklyHours}`);
    const rec = recommendTopic({ planStartDate: plan.planStartDate, examDate: plan.examDate, now });
    console.log(`Recommender says the current topic is: ${rec ? `${rec.topicName} (${rec.studyType})` : "— (null: cannot reliably recommend)"}`);
  } else {
    console.log(`Saved plan: NONE → recommender returns null → nudges will be SKIPPED as unreliable.`);
  }

  // --- plan tier + cap status ---
  const userPlan = await getUserPlan(userId);
  const caps = getCapsForPlan(userPlan.plan);
  const nudgesUsed = await countUsageLast7Days(userId, "nudge_sent");
  const capCheck = await canUseFeature(userId, userPlan.plan, "nudge_sent");
  console.log(`Plan tier: ${userPlan.plan}  |  nudge cap: ${caps.nudgesPerWeek ?? "unlimited"}/7d  |  used(7d): ${nudgesUsed}  |  allowed now: ${capCheck.allowed}`);

  // --- push subscriptions (count only; endpoints not printed) ---
  const subCount = await prisma.pushSubscription.count({ where: { userId } });
  console.log(`Push subscriptions: ${subCount} device(s)`);
  line();

  // --- live candidate windows (same query as the cron) ---
  const liveWindows = await prisma.studyWindow.findMany({
    where: { userId, notified: false, startTime: { gte: now, lte: deadline } },
    orderBy: { startTime: "asc" },
  });

  let windows: WinLike[] = liveWindows.map((w) => ({
    id: w.id,
    startTime: w.startTime,
    endTime: w.endTime,
    durationMin: w.durationMin,
    topicName: w.topicName,
    studyType: w.studyType,
  }));

  if (windows.length === 0) {
    console.log(`No live upcoming un-notified windows in the next 60 min.`);
    console.log(`→ Running SYNTHETIC (in-memory) windows to demonstrate the decision matrix:\n`);
    const mk = (offsetMin: number, dur: number): WinLike => ({
      id: `synthetic-${dur}m`,
      startTime: new Date(now.getTime() + offsetMin * 60000),
      endTime: new Date(now.getTime() + (offsetMin + dur) * 60000),
      durationMin: dur,
      topicName: null,
      studyType: null,
      synthetic: true,
    });
    windows = [mk(10, 8), mk(15, 30), mk(40, 50)]; // 8m (too short), 30m, 50m
  } else {
    console.log(`${windows.length} live candidate window(s):`);
  }

  // --- decision per window (mirror of the cron, but no send / no write) ---
  for (const win of windows) {
    line();
    const minutesUntil = Math.max(0, Math.round((win.startTime.getTime() - now.getTime()) / 60000));
    console.log(`Window ${win.id}${win.synthetic ? " [SYNTHETIC]" : ""}`);
    console.log(`  starts in ${minutesUntil} min · duration ${win.durationMin} min · topic=${win.topicName ?? "null"}`);

    if (!capCheck.allowed) {
      console.log(`  DECISION: SKIP (cap reached) → would mark notified, no push`);
      continue;
    }
    if (subCount === 0 && !win.synthetic) {
      console.log(`  DECISION: SKIP (no push subscription) → would mark notified, no push`);
      continue;
    }
    if (subCount === 0 && win.synthetic) {
      console.log(`  (note: 0 real devices — subscription gate bypassed for this synthetic demo)`);
    }

    let topicName = win.topicName;
    let studyType = win.studyType;
    if (!topicName && plan) {
      const rec = recommendTopic({ planStartDate: plan.planStartDate, examDate: plan.examDate, now });
      if (rec) {
        topicName = rec.topicName;
        studyType = rec.studyType;
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
      console.log(`  DECISION: SKIP (no reliable micro-dose) → would mark notified, no push`);
      continue;
    }

    console.log(`  DECISION: WOULD SEND push (NOT sent in dry-run)`);
    console.log(`    title:   ${payload.title}`);
    console.log(`    body:    ${payload.body}`);
    console.log(`    url:     ${payload.url}`);
    console.log(`    actions: ${payload.actions.map((a) => `[${a.action}] ${a.title}`).join("  ·  ")}`);
    console.log(`    resolved topic: ${topicName} (${studyType})`);
  }

  line();
  console.log(`Dry-run complete. No push sent, no rows written.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
