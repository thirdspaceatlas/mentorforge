"use client";

/**
 * Dev preview — renders the new Calendar Coach hero, day ribbon, and trends
 * disclosure with hard-coded mock data. No auth, no DB, no API.
 *
 * Visit: http://localhost:3000/dev/dashboard-preview
 */
import {
  HeroNextSession,
  TodaysDocket,
} from "@/components/calendar/CalendarCoachDashboard";
import { RecentConsistencyBars } from "@/components/calendar/RecentConsistencyBars";
import { TrendsDisclosure } from "@/components/calendar/TrendsDisclosure";

type DashWindow = {
  id: string;
  topicName: string | null;
  studyType: string | null;
  startTime: string;
  durationMin: number;
  status: "done" | "current" | "upcoming";
};

function buildMock() {
  // Fixed clock-times pinned to today so the ribbon always renders cleanly,
  // regardless of when the dev visits the preview.
  const at = (h: number, m = 0): string => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const todayWindows: DashWindow[] = [
    {
      id: "w1",
      topicName: "Probability Distributions",
      studyType: "review",
      startTime: at(7, 30),
      durationMin: 45,
      status: "done",
    },
    {
      id: "w2",
      topicName: "Standard III · Duties",
      studyType: "review",
      startTime: at(10, 0),
      durationMin: 30,
      status: "done",
    },
    {
      id: "w3",
      topicName: "Reading 23 · DCF practice",
      studyType: "new",
      startTime: at(13, 0),
      durationMin: 45,
      status: "upcoming",
    },
    {
      id: "w4",
      topicName: "Pensions & PP/E",
      studyType: "practice",
      startTime: at(16, 30),
      durationMin: 30,
      status: "upcoming",
    },
    {
      id: "w5",
      topicName: "25 flashcards",
      studyType: "review",
      startTime: at(19, 30),
      durationMin: 30,
      status: "upcoming",
    },
  ];

  const nextWindow = todayWindows.find((w) => w.status === "upcoming") ?? null;

  // 16-day pattern (oldest → today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 15);
  const minutesPattern = [60, 90, 45, 0, 75, 120, 30, 90, 60, 0, 45, 105, 90, 60, 75, 90];
  const heatmap = minutesPattern.map((m, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), minutes: m };
  });

  const minutesToday = 75;

  return { todayWindows, nextWindow, heatmap, minutesToday };
}

export default function DashboardPreview() {
  const { todayWindows, nextWindow, heatmap, minutesToday } = buildMock();

  return (
    <section
      className="-mx-4 -my-8 min-h-screen bg-paper px-4 py-10 sm:-mx-8 sm:-my-14 sm:px-8 sm:py-14"
      aria-label="Dashboard preview"
    >
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
        DEV PREVIEW · {new Date().toLocaleString()}
      </p>

      {nextWindow && (
        <HeroNextSession
          nextWindow={nextWindow}
          todayWindows={todayWindows}
          minutesToday={minutesToday}
          pacePercent={62}
          daysToExam={84}
          calendarsConnected={2}
          calendarPreferredSessionMin={45}
          onCalendarPreferredSessionMinChange={() => {}}
          onBegin={() =>
            alert("Begin session — preview only. In the real app this routes to /app/session/{id}.")
          }
        />
      )}

      <TodaysDocket
        windows={todayWindows}
        nextWindow={nextWindow}
        minutesToday={minutesToday}
      />

      <TrendsDisclosure>
        <RecentConsistencyBars days={heatmap} />
      </TrendsDisclosure>
    </section>
  );
}
