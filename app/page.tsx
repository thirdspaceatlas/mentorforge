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
    <div className="space-y-24 pb-24 sm:space-y-32 sm:pb-32">
      {/* Hero */}
      <section className="relative mx-auto max-w-2xl pt-8 text-center sm:pt-4">
        <p className="mb-6 font-display text-[0.7rem] font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          CFA study planning
        </p>
        <h1 className="font-display text-[2.125rem] font-medium leading-[1.15] tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl sm:leading-[1.1]">
          Forge a realistic CFA study plan.
        </h1>
        <div className="mx-auto mt-8 max-w-md border-t border-slate-200/80 pt-8 dark:border-slate-700/80" />
        <p className="mx-auto max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Turn your exam date and available hours into a study plan built for real
          life.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Plan, pace, and rebalance your study path with confidence.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200 dark:focus-visible:ring-offset-slate-950"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full border border-slate-300/90 bg-white/80 px-8 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:border-slate-600 dark:bg-transparent dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900/50 dark:focus-visible:ring-offset-slate-950"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
            What MentorForge does
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Study planning and pacing software—not tutoring, coaches, or a marketplace.
          </p>
        </div>
        <div className="mt-14 grid gap-px bg-slate-200/80 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-[#fafaf9] p-8 dark:bg-slate-950 sm:min-h-[11rem]"
            >
              <h3 className="font-display text-lg font-medium text-slate-900 dark:text-slate-100">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-xl">
        <h2 className="text-center font-display text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <ol className="mt-12 space-y-10">
          {[
            ["1. Enter your details", "Pick your CFA level, exam window, start date, and weekly hours."],
            ["2. Generate your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
            ["3. Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
            ["4. Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."]
          ].map(([title, desc]) => (
            <li key={title} className="flex gap-6 border-b border-slate-200/80 pb-10 last:border-0 last:pb-0 dark:border-slate-800/80">
              <span className="font-display text-2xl font-medium tabular-nums text-slate-400 dark:text-slate-500">
                {title![0]}
              </span>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{title!.slice(3)}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-lg border-t border-slate-200/80 pt-16 text-center dark:border-slate-800/80">
        <p className="font-display text-xl font-medium leading-snug text-slate-900 dark:text-slate-50">
          Ready to map a CFA study runway you can defend week to week?
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200 dark:focus-visible:ring-offset-slate-950"
        >
          Create your free account
        </Link>
        <p className="mt-8 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
          No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
        </p>
      </section>
    </div>
  );
}
