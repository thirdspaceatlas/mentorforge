"use client";

import { useEffect, useState } from "react";
import { CalendarCoachDashboard } from "@/components/calendar/CalendarCoachDashboard";

/**
 * Dashboard surface — "what now, what today?". The Calendar Coach hero +
 * DayRibbon + Trends, on the cream editorial frame. Plan architecture lives
 * at /app.
 */
export default function TodayPage() {
  const [preferredMin, setPreferredMin] = useState(45);

  useEffect(() => {
    fetch("/api/study-plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const v = data?.plan?.calendarPreferredSessionMin;
        if (typeof v === "number") setPreferredMin(v);
      })
      .catch(() => {});
  }, []);

  const persistPreferred = async (n: number) => {
    const clamped = Math.min(180, Math.max(5, Math.round(n)));
    setPreferredMin(clamped);
    const res = await fetch("/api/study-plan");
    const data = res.ok ? await res.json() : null;
    if (!data?.plan) return;
    await fetch("/api/study-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data.plan,
        calendarPreferredSessionMin: clamped,
      }),
    });
    fetch("/api/calendar/sync", { method: "POST" }).catch(() => {});
  };

  return (
    <div className="min-w-0 max-w-full">
      <CalendarCoachDashboard
        calendarPreferredSessionMin={preferredMin}
        onCalendarPreferredSessionMinChange={persistPreferred}
      />
    </div>
  );
}
