import Link from "next/link";
import { fullFaqs } from "../faq-data";

export default function LearnMorePage() {
  return (
    <div className="space-y-24 pb-28 sm:space-y-32 sm:pb-36">
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

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          A simple flow designed to keep candidates moving when schedules shift.
        </p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            "Set level, exam window, start date, and realistic weekly capacity.",
            "Generate a full plan with pacing and week-by-week topic focus.",
            "Track actual progress and mark completion as weeks pass.",
            "Rebalance future weeks when life interrupts your schedule."
          ].map((step, idx) => (
            <li
              key={step}
              className="rounded-2xl border border-slate-200/95 bg-white/95 p-6 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none"
            >
              <span className="font-display text-[2rem] font-medium text-slate-400 dark:text-slate-500">
                {idx + 1}
              </span>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          What makes MentorForge different
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Designed for execution, not just initial planning.
        </p>
        <div className="mt-8 grid gap-px bg-slate-200/90 dark:bg-slate-700/50 sm:grid-cols-2">
          {[
            "Built around exam windows and realistic weekly pacing, not one-time static planning.",
            "Handles partial first and last weeks so plans match actual calendar reality.",
            "Combines benchmark readiness with real progress tracking and status visibility.",
            "Rebalances future weeks so candidates can recover without starting over."
          ].map((item) => (
            <div key={item} className="bg-[#fafaf9] p-6 dark:bg-slate-950">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
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

      <section className="mx-auto max-w-2xl border-t border-slate-200/70 pt-20 text-center dark:border-slate-800/80 sm:pt-28">
        <p className="font-display text-[1.65rem] font-medium leading-[1.22] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.75rem]">
          Ready to build your plan and keep it on track?
        </p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Same planner as the homepage — deeper context above. Create an account to open the full experience.
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
      </section>
    </div>
  );
}
