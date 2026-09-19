import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";
import { fullFaqs } from "../faq-data";

const howSteps = [
  "Pick your level, exam window, start date, and a weekly hour number you can actually keep.",
  "Get a full plan with a topic focus for each week.",
  "Log what you did. Mark weeks done as you go.",
  "When a week falls apart, rebalance the weeks still ahead."
] as const;

const differentiators: { lead: string; rest: string }[] = [
  {
    lead: "Built backward from the sitting",
    rest: "The plan starts from the exam window you chose, not from a generic 18-week template."
  },
  {
    lead: "Short weeks stay short",
    rest: "The first and last weeks are often partial. The plan treats them that way instead of pretending you have seven full days."
  },
  {
    lead: "Hours vs. the plan",
    rest: "You see how you're doing against the hours you meant to do, not a vibe check."
  },
  {
    lead: "Rebalance without starting over",
    rest: "Miss a week, keep the plan. Future weeks absorb what's left."
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
          How this actually works
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
          If you&apos;ve ever built a CFA schedule in a spreadsheet and abandoned it by March, you already know the problem. The plan has to survive the weeks that don&apos;t go as written.
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 sm:gap-10">
        <article className="rounded-2xl border border-slate-200/95 bg-white/95 p-7 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            What MentorForge does
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            You give it a level, an exam window, and the hours you can spare. It turns that into a week-by-week plan. When you log real hours, the remaining weeks update instead of pretending nothing happened.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/95 bg-white/95 p-7 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
            Why it exists
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            People rarely fail CFA because they couldn&apos;t find a textbook. They fail because the calendar won. This is here so a bad week doesn&apos;t kill the rest of the plan.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-4xl border-t border-slate-200/70 pt-14 dark:border-slate-800/80 sm:pt-16">
        <h2 className="font-display text-[1.95rem] font-medium tracking-tight text-slate-900 dark:text-slate-50">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Four steps. The useful part is what happens after week one.
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
          What this does that a spreadsheet doesn&apos;t
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          The first draft of a plan is easy. Keeping it honest is the work.
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
          A spreadsheet and a chatbot can start a plan. They don&apos;t stay with you when the week goes sideways.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/95 bg-white/95 dark:border-slate-700/85 dark:bg-slate-900/65">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-700/80">
                <th className="min-w-[140px] whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{""}</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-accent dark:text-accent">MentorForge</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Spreadsheet</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">General AI</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="min-w-[140px] whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Exam windows &amp; pacing</td>
                <td className="whitespace-nowrap px-4 py-3 text-accent">Core</td>
                <td className="whitespace-nowrap px-4 py-3">Manual</td>
                <td className="whitespace-nowrap px-4 py-3">Ad hoc</td>
              </tr>
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="min-w-[140px] whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Rebalance when life shifts</td>
                <td className="whitespace-nowrap px-4 py-3 text-accent">Built in</td>
                <td className="whitespace-nowrap px-4 py-3">Manual</td>
                <td className="whitespace-nowrap px-4 py-3">One-off</td>
              </tr>
              <tr className="border-b border-slate-200/70 dark:border-slate-800/80">
                <td className="min-w-[140px] whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Progress vs. plan</td>
                <td className="whitespace-nowrap px-4 py-3 text-accent">Tracked</td>
                <td className="whitespace-nowrap px-4 py-3">DIY</td>
                <td className="whitespace-nowrap px-4 py-3">Varies</td>
              </tr>
              <tr>
                <td className="min-w-[140px] whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Partial week handling</td>
                <td className="whitespace-nowrap px-4 py-3 text-accent">Built in</td>
                <td className="whitespace-nowrap px-4 py-3">Manual</td>
                <td className="whitespace-nowrap px-4 py-3">Not addressed</td>
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
          supporting="Make a free account and build the first plan. Adjust it when a week goes sideways."
          primaryLabel="Create your free account"
        />
      </section>
    </div>
  );
}
