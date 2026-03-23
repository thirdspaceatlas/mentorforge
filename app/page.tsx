import Link from "next/link";
import { HeroProductPreview } from "@/components/marketing/HeroProductPreview";
import { homepageFaqs } from "./faq-data";

type Feature = {
  title: string;
  description: string;
  /** Slightly elevated treatment for core product ideas */
  emphasis?: boolean;
};

const features: Feature[] = [
  {
    title: "Realistic weekly plans",
    description:
      "Enter your exam window, available hours, and start date. MentorForge builds a week-by-week CFA plan anchored to widely used study-hour benchmarks\u2014grounded in your calendar, not guesswork.",
    emphasis: true
  },
  {
    title: "Levels I, II & III",
    description:
      "Topic sequencing, exam weights, and level-specific study tactics update when you switch levels. Level III reflects all three registration pathways."
  },
  {
    title: "Smart rebalancing",
    description:
      "Log actual hours when life gets in the way. Missed load rolls forward into remaining weeks so your runway stays honest and achievable.",
    emphasis: true
  },
  {
    title: "Progress tracking",
    description:
      "Mark weeks complete, scan status pills (not started / partial / complete), and watch your plan status and readiness narrative stay in sync with what you log.",
    emphasis: true
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
    <div className="space-y-24 pb-28 sm:space-y-32 sm:pb-36">
      {/* Hero */}
      <section className="relative mx-auto max-w-3xl border-b border-slate-200/70 pb-16 pt-10 text-center dark:border-slate-800/80 sm:pb-20 sm:pt-12">
        <p className="mb-5 font-display text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          CFA study planning
        </p>
        <h1 className="font-display text-[2.35rem] font-medium leading-[1.08] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[3.65rem]">
          Forge a realistic CFA study plan.
        </h1>
        <div className="mx-auto mt-7 max-w-md border-t border-slate-200/80 pt-7 dark:border-slate-700/70" />
        <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-700 dark:text-slate-200">
          Turn your exam date and available hours into a study plan built for real
          life.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Plan, pace, and rebalance your study path with confidence.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200 dark:focus-visible:ring-offset-slate-950"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full border border-slate-300/90 bg-white/80 px-8 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900/70 dark:focus-visible:ring-offset-slate-950"
          >
            Log in
          </Link>
        </div>

        <HeroProductPreview />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl scroll-mt-8">
        <div className="text-center">
          <h2 className="font-display text-[2rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            What MentorForge does
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Study planning and pacing software—not tutoring, coaches, or a marketplace.
          </p>
        </div>
        <div className="mt-12 grid gap-px bg-slate-200/90 dark:bg-slate-700/50 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={f.title}
              className={
                "p-7 sm:min-h-[11rem] " +
                (f.emphasis
                  ? "bg-white ring-1 ring-inset ring-slate-200/90 dark:bg-slate-900/75 dark:ring-slate-600/40"
                  : "bg-[#fafaf9] dark:bg-slate-950") +
                (idx < 2 ? " sm:min-h-[12.25rem]" : "")
              }
            >
              <h3
                className={
                  "font-display text-[1.15rem] text-slate-900 dark:text-slate-50 " +
                  (f.emphasis ? "font-semibold" : "font-medium")
                }
              >
                {f.title}
              </h3>
              <p
                className={
                  "mt-2.5 text-sm leading-relaxed " +
                  (f.emphasis
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-700 dark:text-slate-400")
                }
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-2xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
        <h2 className="text-center font-display text-[2rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <ol className="mt-10 space-y-7">
          {[
            ["1. Enter your details", "Pick your CFA level, exam window, start date, and weekly hours."],
            ["2. Generate your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
            ["3. Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
            ["4. Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."]
          ].map(([title, desc]) => (
            <li
              key={title}
              className="flex gap-5 rounded-2xl border border-slate-200/95 bg-white/90 p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/65 dark:shadow-none"
            >
              <span className="font-display text-3xl font-medium tabular-nums leading-none text-slate-400 dark:text-slate-500">
                {title![0]}
              </span>
              <div className="pt-0.5">
                <p className="text-base font-medium text-slate-900 dark:text-slate-100">{title!.slice(3)}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
        <h2 className="text-center font-display text-[2rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200/95 bg-white/95 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          {homepageFaqs.map((faq, idx) => (
            <details
              key={faq.question}
              open={idx === 0}
              className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-7"
            >
              <summary className="cursor-pointer list-none pr-8 text-[0.97rem] font-medium leading-relaxed text-slate-900 marker:content-none dark:text-slate-100">
                {faq.question}
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/learn-more"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-500 dark:text-slate-300 dark:decoration-slate-500 dark:hover:text-slate-100 dark:hover:decoration-slate-400"
          >
            Learn More →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl border-t border-slate-200/70 pt-20 text-center dark:border-slate-800/80 sm:pt-28">
        <p className="font-display text-[1.8rem] font-medium leading-[1.2] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.95rem]">
          Build a CFA study plan you can actually follow.
        </p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Map your runway, log real hours, and rebalance when life happens — without losing the thread.
        </p>
        <Link
          href="/register"
          className="mt-9 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200 dark:focus-visible:ring-offset-slate-950"
        >
          Create your free account
        </Link>
        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
        </p>
        <div className="mt-6">
          <Link
            href="/learn-more"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-slate-500 dark:text-slate-300 dark:decoration-slate-500 dark:hover:text-slate-100 dark:hover:decoration-slate-400"
          >
            FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
