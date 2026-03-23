import Link from "next/link";
import { FeatureIcon } from "@/components/marketing/FeatureIcons";
import { HeroProductPreviews } from "@/components/marketing/HeroProductPreview";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";
import { homepageFaqs } from "./faq-data";

type Feature = {
  title: string;
  description: string;
  icon: "plans" | "levels" | "rebalance" | "progress" | "calendar" | "ethics";
  emphasis?: boolean;
};

const features: Feature[] = [
  {
    title: "Realistic weekly plans",
    description:
      "Enter your exam window, available hours, and start date. MentorForge builds a week-by-week CFA plan anchored to widely used study-hour benchmarks\u2014grounded in your calendar, not guesswork.",
    icon: "plans",
    emphasis: true
  },
  {
    title: "Levels I, II & III",
    description:
      "Topic sequencing, exam weights, and level-specific study tactics update when you switch levels. Level III reflects all three registration pathways.",
    icon: "levels"
  },
  {
    title: "Smart rebalancing",
    description:
      "Log actual hours when life gets in the way. Missed load rolls forward into remaining weeks so your runway stays honest and achievable.",
    icon: "rebalance",
    emphasis: true
  },
  {
    title: "Progress tracking",
    description:
      "Mark weeks complete, scan status pills (not started / partial / complete), and watch your plan status and readiness narrative stay in sync with what you log.",
    icon: "progress",
    emphasis: true
  },
  {
    title: "Calendar & progress views",
    description:
      "Choose a calendar-anchored window or follow your first incomplete week\u2014so the planner stays where you are, not stuck on week one.",
    icon: "calendar"
  },
  {
    title: "Ethics & review spacing",
    description:
      "Ethics appears at sensible intervals, review checkpoints slot in for longer plans, and heavier topics can get a second pass before the exam.",
    icon: "ethics"
  }
];

const howSteps = [
  ["Enter your details", "Pick your CFA level, exam window, start date, and weekly hours."],
  ["Generate your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
  ["Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
  ["Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."]
] as const;

export default function LandingPage() {
  return (
    <div className="space-y-0 pb-28 sm:pb-36">
      {/* Hero */}
      <section className="relative border-b border-slate-200/70 pb-16 pt-10 dark:border-slate-800/80 sm:pb-20 sm:pt-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="mb-5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-slate-600 dark:text-slate-300">
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
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/register"
              className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground dark:focus-visible:ring-offset-slate-950"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 underline decoration-slate-300/90 underline-offset-[5px] transition-colors hover:text-slate-800 dark:text-slate-500 dark:decoration-slate-600 dark:hover:text-slate-200"
            >
              Log in
            </Link>
          </div>
        </div>

        <HeroProductPreviews />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl scroll-mt-8 rounded-2xl px-4 py-16 dark:bg-[#0a0f1a] sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="font-display text-[2rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            What MentorForge does
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] font-medium leading-relaxed text-slate-700 dark:text-slate-300">
            Study planning and pacing software—not tutoring, coaches, or a marketplace.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={
                "flex h-full min-h-[17.5rem] flex-col rounded-2xl border p-7 " +
                (f.emphasis
                  ? "border-slate-200/95 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-600/50 dark:bg-slate-900/85 dark:ring-white/[0.04]"
                  : "border-slate-200/80 bg-[#fafaf9] dark:border-slate-700/60 dark:bg-[#0f1520]")
              }
            >
              <div className="flex items-start gap-3">
                <FeatureIcon name={f.icon} />
                <h3
                  className={
                    "font-display text-[1.15rem] leading-snug text-slate-900 dark:text-slate-50 " +
                    (f.emphasis ? "font-semibold" : "font-medium")
                  }
                >
                  {f.title}
                </h3>
              </div>
              <p
                className={
                  "mt-2.5 flex-1 text-sm leading-relaxed " +
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
      <section className="mx-auto max-w-2xl border-t border-slate-200/70 px-0 py-16 dark:border-slate-800/80 dark:bg-slate-950 sm:py-20">
        <h2 className="text-center font-display text-[2rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <ol className="mx-auto mt-10 max-w-xl space-y-0">
          {howSteps.map(([title, desc], i) => (
            <li key={title} className="relative">
              {i > 0 && (
                <div
                  className="mx-auto mb-8 h-px w-[min(100%,20rem)] border-t border-dashed border-slate-300/90 dark:border-slate-600/80"
                  aria-hidden
                />
              )}
              <div className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold tabular-nums text-accent-foreground shadow-sm"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 shrink pt-0.5">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {desc}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl border-t border-slate-200/70 px-4 py-16 dark:border-slate-800/80 dark:bg-[#0a0f1a] sm:px-6 sm:py-20">
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
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 hover:decoration-accent dark:text-slate-300 dark:decoration-slate-500 dark:hover:text-slate-100 dark:hover:decoration-accent"
          >
            Learn More →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-0 pt-20 sm:pt-24">
        <MarketingBottomCTA
          headline="Build a CFA study plan you can actually follow."
          supporting="Map your runway, log real hours, and rebalance when life happens — without losing the thread."
        />
        <div className="mt-10 text-center">
          <Link
            href="/learn-more"
            className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
