import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/windows — List study windows for the user.
 *
 * Query params:
 *   date — ISO date string (YYYY-MM-DD), defaults to today
 *   range — "day" | "week", defaults to "day"
 *
 * Returns windows with their session status (done/current/upcoming).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const range = url.searchParams.get("range") || "day";

  const startDate = new Date(dateParam + "T00:00:00");
  const endDate = new Date(dateParam + "T23:59:59");

  if (range === "week") {
    endDate.setDate(endDate.getDate() + 6);
  }

  const windows = await prisma.studyWindow.findMany({
    where: {
      userId: user.id,
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    },
    include: {
      sessions: {
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          interrupted: true,
          actualMin: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // Derive status for each window
  const now = new Date();
  const enriched = windows.map((w) => {
    const session = w.sessions[0] ?? null;
    let status: "done" | "current" | "upcoming" = "upcoming";

    if (session?.completedAt && !session.interrupted) {
      status = "done";
    } else if (w.startTime <= now && w.endTime >= now) {
      status = "current";
    } else if (w.endTime < now) {
      status = "done"; // passed without session = expired, show as done (grayed)
    }

    return {
      id: w.id,
      startTime: w.startTime,
      endTime: w.endTime,
      durationMin: w.durationMin,
      topicName: w.topicName,
      studyType: w.studyType,
      status,
      session,
    };
  });

  return NextResponse.json({ windows: enriched });
}
