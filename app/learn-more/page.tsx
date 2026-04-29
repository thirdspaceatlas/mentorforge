import Link from "next/link";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";
import { fullFaqs } from "../faq-data";

const howSteps = [
  "Set level, exam window, start date, and realistic weekly capacity.",
  "Build a full plan with pacing and week-by-week topic focus.",
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
    <div className="relative left-1/2 -my-8 -ml-[50vw] w-screen bg-paper sm:-my-14">
      <div className="mx-auto max-w-[1200px] space-y-20 px-4 pb-16 pt-12 sm:space-y-24 sm:px-8 sm:pb-20 sm:pt-16">
      <section className="mx-auto max-w-4xl border-b border-slate-200/70 px-4 pb-16 pt-2 text-center dark:border-slate-800/80 sm:pb-16 sm:px-6">
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
              className="rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-slate-700/80 dark:bg-slate-900"
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
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Progress vs. plan</td>
                <td className="px-4 py-3 text-accent">Tracked</td>
                <td className="px-4 py-3">DIY</td>
                <td className="px-4 py-3">Varies</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Partial week handling</td>
                <td className="px-4 py-3 text-accent">Built in</td>
                <td className="px-4 py-3">Manual</td>
                <td className="px-4 py-3">Not addressed</td>
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
          {fullFaqs.map((faq) => (
            <details
              key={faq.question}
              className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-8"
            >
              <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center pr-8 text-left text-[0.97rem] font-medium leading-relaxed text-slate-900 marker:content-none [-webkit-tap-highlight-color:transparent] dark:text-slate-100">
                <span className="flex-1">{faq.question}</span>
                <span className="ml-2 shrink-0 text-slate-500 transition-transform duration-200 ease group-open:rotate-90 dark:text-slate-400" aria-hidden>›</span>
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      </div>
      <section className="pt-20 sm:pt-24">
        <MarketingBottomCTA
          variant="band"
          headline="You've seen how it works."
          supporting="Build a plan that holds — and stays honest when life gets in the way."
          primaryLabel="Create your free account"
        />
      </section>
    </div>
  );
}
