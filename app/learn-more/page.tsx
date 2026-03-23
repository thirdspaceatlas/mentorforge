import Link from "next/link";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";
import { fullFaqs } from "../faq-data";

const howSteps = [
  "Set level, exam window, start date, and realistic weekly capacity.",
  "Generate a full plan with pacing and week-by-week topic focus.",
  "Track actual progress and mark completion as weeks pass.",
  "Rebalance future weeks when life interrupts your schedule."
] as const;

const differentiators: { lead: string; rest: string }[] = [
  {
    lead: "Exam-window pacing",
    rest: "Built around exam windows and realistic weekly pacing, not one-time static planning."
  },
  {
    lead: "Calendar-accurate weeks",
    rest: "Handles partial first and last weeks so plans match actual calendar reality."
  },
  {
    lead: "Readiness + progress",
    rest: "Combines benchmark readiness with real progress tracking and status visibility."
  },
  {
    lead: "Rebalance without reset",
    rest: "Rebalances future weeks so candidates can recover without starting over."
  }
];

export default function LearnMorePage() {
  return (
    <div className="space-y-20 pb-28 sm:space-y-24 sm:pb-36">
      <section className="mx-auto max-w-4xl border-b border-slate-200/70 pb-16 pt-2 text-center dark:border-slate-800/80 sm:pb-16">
        <p className="mb-4 font-display text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          MentorForge
        </p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-[3.2rem]">
          Learn More
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
          MentorForge helps candidates plan, pace, and rebalance their study process for serious exams and certifications.
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 sm:gap-10">
        <article className="rounded-2xl border border-slate-200/95 bg-white/95 p-7 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            What MentorForge does
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            MentorForge turns exam timing, available weekly hours, and real progress into a structured study runway. It keeps plans practical, visible, and adaptable instead of static.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/95 bg-white/95 p-7 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            Why MentorForge exists
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Most candidates do not fail because they lack materials. They fall behind on pacing and execution. MentorForge exists to help users recover from disruption and still finish strong.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-14 dark:border-slate-800/80 sm:pt-16">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A simple flow designed to keep candidates moving when schedules shift.
        </p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2">
          {howSteps.map((step, idx) => (
            <li
              key={step}
              className="rounded-2xl border border-slate-200/95 bg-white/95 p-6 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-sm">
                {idx + 1}
              </span>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-14 dark:border-slate-800/80 sm:pt-16">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          What makes MentorForge different
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Designed for execution, not just initial planning.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {differentiators.map(({ lead, rest }) => (
            <div
              key={lead}
              className="rounded-2xl border border-slate-200/90 bg-[#fafaf9] p-6 dark:border-slate-700/80 dark:bg-[#0f1520]"
            >
              <p className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                {lead}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{rest}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-14 dark:border-slate-800/80 sm:pt-16">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How MentorForge compares
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Planning and pacing built for long exam runways — not a generic chat or a static sheet.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/95 bg-white/95 dark:border-slate-700/85 dark:bg-slate-900/65">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-700/80">
                <th className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{""}</th>
                <th className="px-4 py-3 font-semibold text-accent dark:text-accent">MentorForge</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Spreadsheet</th>
                <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">General AI</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Exam windows &amp; pacing</td>
                <td className="px-4 py-3 text-accent">Core</td>
                <td className="px-4 py-3">Manual</td>
                <td className="px-4 py-3">Ad hoc</td>
              </tr>
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Rebalance when life shifts</td>
                <td className="px-4 py-3 text-accent">Built in</td>
                <td className="px-4 py-3">Manual</td>
                <td className="px-4 py-3">One-off</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Progress vs. plan</td>
                <td className="px-4 py-3 text-accent">Tracked</td>
                <td className="px-4 py-3">DIY</td>
                <td className="px-4 py-3">Varies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-14 dark:border-slate-800/80 sm:pt-16">
        <h2 className="text-center font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          Full FAQ
        </h2>
        <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-slate-200/95 bg-white/95 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          {fullFaqs.map((faq, idx) => (
            <details
              key={faq.question}
              open={idx === 0}
              className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-8"
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
      </section>

      <section className="mx-auto max-w-2xl px-0 pt-20 sm:pt-24">
        <MarketingBottomCTA
          headline="Build a plan you can defend week to week."
          supporting="See the full FAQ above — then open the planner when you’re ready."
        />
      </section>
    </div>
  );
}
