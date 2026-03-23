import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — MentorForge",
  description:
    "Free, Level Pass, and All-Access plans for CFA study planning. One-time payment. No subscriptions."
};

const pricingFaqs = [
  {
    q: "Do I need to buy again if I move to the next level?",
    a: "Yes — unless you have All-Access. We recommend All-Access if you know you're going all the way."
  },
  {
    q: "What if I fail and need to retake?",
    a: "Reach out. We offer a 50% retake discount — no questions asked."
  },
  {
    q: "Is this a tutoring or prep course?",
    a: "No. MentorForge is purely a planning and pacing tool. It tells you when to study what — you supply the materials."
  }
] as const;

const trustAnchors = [
  "Built around the CFA Institute’s widely cited 300+ study-hour benchmark — grounded in your calendar, not guesswork.",
  "We’re early. Your feedback directly shapes what we build next — and we read every message.",
  "One-time payment. No subscriptions. No surprises.",
  "Independent study-planning software. Not affiliated with CFA Institute."
] as const;

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className="space-y-24 pb-28 sm:space-y-28 sm:pb-36">
      {/* Hero */}
      <header className="mx-auto max-w-3xl border-b border-slate-200/70 pb-14 text-center dark:border-slate-800/80 sm:pb-16">
        <p className="mb-5 font-display text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Pricing
        </p>
        <h1 className="font-display text-[2.1rem] font-medium leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.85rem] sm:leading-[1.08]">
          Stop guessing. Start planning.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-700 dark:text-slate-200">
          A CFA study plan built around your life — not a textbook schedule someone else made up.
        </p>
      </header>

      {/* Pricing tiers */}
      <section aria-labelledby="pricing-tiers-heading" className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="pricing-tiers-heading"
            className="font-display text-[1.35rem] font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.5rem]"
          >
            Pricing tiers
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-5">
          {/* Free */}
          <article className="flex flex-col rounded-2xl border border-slate-200/95 bg-[#fafaf9] p-7 shadow-sm dark:border-slate-700/80 dark:bg-slate-950 sm:p-8">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Free <span className="font-normal text-slate-500 dark:text-slate-400">—</span>{" "}
                <span className="tabular-nums">$0</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Try it before you commit.
              </p>
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
              What&apos;s included
            </p>
            <FeatureList
              items={[
                "Level I plan generation",
                "Week-by-week topic sequencing",
                "Exam-weight-based scheduling"
              ]}
            />
            <div className="mt-auto pt-8">
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-full border border-slate-300/90 bg-white px-5 py-3 text-center text-sm font-medium text-slate-900 transition-colors hover:border-slate-400 hover:bg-white dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900/80"
              >
                Get started free — no credit card required
              </Link>
            </div>
          </article>

          {/* Level Pass */}
          <article className="flex flex-col rounded-2xl border border-slate-200/95 bg-white p-7 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 sm:p-8">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Level Pass <span className="font-normal text-slate-500 dark:text-slate-400">—</span>{" "}
                <span className="tabular-nums">$34</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Everything you need for one level.
              </p>
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
              What&apos;s included
            </p>
            <FeatureList
              items={[
                "Full plan generation (Level I, II, or III)",
                "Smart rebalancing when life gets in the way",
                "Progress tracking & readiness narrative",
                "Ethics and review spacing built in",
                "Calendar + progress views",
                "Lifetime access for your level"
              ]}
            />
            <div className="mt-auto pt-8">
              <Link
                href="/register?plan=level-pass"
                className="flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
              >
                Buy Level Pass
              </Link>
              <p className="mt-3 text-center text-[0.75rem] leading-snug text-slate-500 dark:text-slate-500">
                Less than the cost of one Schweser mock exam.
              </p>
            </div>
          </article>

          {/* All-Access — emphasized */}
          <article className="relative flex flex-col rounded-2xl border border-slate-900/15 bg-white p-7 pb-8 pt-9 shadow-md ring-1 ring-slate-900/[0.06] dark:border-slate-600/50 dark:bg-slate-900/85 dark:ring-white/10 sm:p-8 sm:pb-8 sm:pt-10">
            <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 justify-center">
              <span className="rounded-full border border-slate-200/90 bg-white px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300">
                Most popular for first-time candidates
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                All-Access <span className="font-normal text-slate-500 dark:text-slate-400">—</span>{" "}
                <span className="tabular-nums">$74</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                For candidates who are in it for all three.
              </p>
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              What&apos;s included
            </p>
            <FeatureList
              items={[
                "Everything in Level Pass",
                "All three CFA levels unlocked",
                "Best value if you’re committed to the full journey"
              ]}
            />
            <div className="mt-auto pt-8">
              <Link
                href="/register?plan=all-access"
                className="flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-stone-200"
              >
                Buy All-Access — Best Value
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Trust anchors */}
      <section
        aria-label="Trust"
        className="mx-auto max-w-4xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {trustAnchors.map((text) => (
            <div
              key={text}
              className="rounded-xl border border-slate-200/90 bg-white/90 px-5 py-4 dark:border-slate-700/70 dark:bg-slate-900/50"
            >
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="mx-auto max-w-3xl border-t border-slate-200/70 pt-16 dark:border-slate-800/80 sm:pt-20">
        <h2 className="text-center font-display text-[1.85rem] font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2rem]">
          Pricing FAQ
        </h2>
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200/95 bg-white/95 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          {pricingFaqs.map((faq, idx) => (
            <details
              key={faq.q}
              open={idx === 0}
              className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-7"
            >
              <summary className="cursor-pointer list-none pr-8 text-[0.97rem] font-medium leading-relaxed text-slate-900 marker:content-none dark:text-slate-100">
                {faq.q}
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
