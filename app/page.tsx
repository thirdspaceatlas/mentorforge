import Link from "next/link";

const features = [
  {
    title: "Realistic weekly plans",
    description:
      "Enter your exam window, available hours, and start date. MentorForge builds a week-by-week CFA plan anchored to widely used study-hour benchmarks\u2014grounded in your calendar, not guesswork."
  },
  {
    title: "Levels I, II & III",
    description:
      "Topic sequencing, exam weights, and level-specific study tactics update when you switch levels. Level III reflects all three registration pathways."
  },
  {
    title: "Smart rebalancing",
    description:
      "Log actual hours when life gets in the way. Missed load rolls forward into remaining weeks so your runway stays honest and achievable."
  },
  {
    title: "Progress tracking",
    description:
      "Mark weeks complete, scan status pills (not started / partial / complete), and watch your plan status and readiness narrative stay in sync with what you log."
  },
  {
    title: "Calendar & progress views",
    description:
      "Choose a calendar-anchored window or follow your first incomplete week\u2014so the planner stays where you are, not stuck on week one."
  },
  {
    title: "Ethics & review spacing",
    description:
      "Ethics appears at sensible intervals, review checkpoints slot in for longer plans, and heavier topics can get a second pass before the exam."
  }
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero */}
      <section className="mx-auto max-w-2xl space-y-6 pt-12 text-center sm:pt-20">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Forge a realistic CFA study plan.
        </h1>
        <p className="mx-auto max-w-lg text-base text-slate-600 dark:text-slate-300">
          Turn your exam date and available hours into a study plan built for real
          life.
        </p>
        <p className="mx-auto max-w-lg text-sm text-slate-500 dark:text-slate-400">
          Plan, pace, and rebalance your study path with confidence.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-3xl">
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          What MentorForge does
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-xs text-slate-500 dark:text-slate-400">
          Study planning and pacing software—not tutoring, coaches, or a marketplace.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-slate-100/80 p-5 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-2xl text-center">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          How it works
        </h2>
        <ol className="mt-8 space-y-6 text-left">
          {[
            ["1. Enter your details", "Pick your CFA level, exam window, start date, and weekly hours."],
            ["2. Generate your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
            ["3. Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
            ["4. Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."]
          ].map(([title, desc]) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-bold text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                {title![0]}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title!.slice(3)}</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-md text-center">
        <p className="text-base font-medium text-slate-900 dark:text-slate-100">
          Ready to map a CFA study runway you can defend week to week?
        </p>
        <Link
          href="/register"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-sky-500 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Create your free account
        </Link>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
        </p>
      </section>
    </div>
  );
}
