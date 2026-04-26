import Link from "next/link";
import type { Metadata } from "next";
import { AllAccessCheckoutButton } from "@/components/pricing/AllAccessCheckoutButton";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";

const priceAllAccess = process.env.NEXT_PUBLIC_STRIPE_PRICE_ALL_ACCESS ?? "";

export const metadata: Metadata = {
  title: "Pricing — MentorForge",
  description:
    "Free forever for CFA Level I with calendar-aware scheduling. All Access unlocks unlimited usage and all three levels for $99 a year."
};

const pricingFaqs = [
  {
    q: "What's the catch with free?",
    a: "No catch, no trial timer. Free stays free — you get the full Level I plan, one calendar connection, a few Calendar Coach nudges per week, and basic progress tracking. All Access removes the caps and unlocks Levels II and III."
  },
  {
    q: "What if I fail and need to retake?",
    a: "All Access is a yearly subscription — if you're still studying next year, just renew. You keep everything you've built and can keep iterating on your plan through the next exam window."
  },
  {
    q: "Is this a tutoring or prep course?",
    a: "No. MentorForge is purely a planning and pacing tool. It tells you when to study what — you supply the materials."
  }
] as const;

const trustAnchors: { text: string; icon: "benchmark" | "feedback" | "independent" | "cancel" }[] = [
  {
    icon: "benchmark",
    text: "Built around the CFA Institute’s widely cited 300+ study-hour benchmark — grounded in your calendar, not guesswork."
  },
  {
    icon: "feedback",
    text: "We’re early. Your feedback directly shapes what we build next — and we read every message."
  },
  {
    icon: "independent",
    text: "Independent study-planning software. Not affiliated with CFA Institute."
  },
  {
    icon: "cancel",
    text: "Cancel All Access anytime in the Stripe Billing Portal. Your plan and history stay with you."
  }
];

function TrustIcon({ type }: { type: (typeof trustAnchors)[number]["icon"] }) {
  const c = "h-5 w-5 shrink-0 text-accent";
  switch (type) {
    case "benchmark":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 6v12M8 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" strokeLinecap="round" />
        </svg>
      );
    case "feedback":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 8h10M7 12h6" strokeLinecap="round" />
          <rect x="4" y="4" width="16" height="14" rx="2" />
        </svg>
      );
    case "independent":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" strokeLinejoin="round" />
        </svg>
      );
    case "cancel":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 12a8 8 0 0113.657-5.657M20 12a8 8 0 01-13.657 5.657" strokeLinecap="round" />
          <path d="M17 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className="space-y-16 pb-16 sm:space-y-20 sm:pb-20">
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

      <p className="mx-auto max-w-2xl text-center text-[0.95rem] font-medium leading-snug text-slate-800 dark:text-slate-200">
        Free forever. Upgrade to All Access when you want unlimited — or never. No trial, no countdown.
      </p>

      <section
        aria-labelledby="pricing-tiers-heading"
        className="mx-auto max-w-5xl rounded-2xl border border-slate-200/60 bg-white/50 px-4 py-8 dark:border-transparent dark:bg-transparent sm:px-6 sm:py-10"
      >
        <div className="text-center">
          <h2
            id="pricing-tiers-heading"
            className="font-display text-[clamp(1.65rem,4vw,2.15rem)] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50"
          >
            Pricing tiers
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch md:gap-5">
          <article className="flex min-h-full flex-col rounded-2xl border border-slate-200/95 bg-[#fafaf9] p-7 shadow-sm dark:border-slate-700/80 dark:bg-slate-950 sm:p-8">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Free
              </p>
              <p className="mt-3 font-display text-3xl font-medium tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                $0
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Free forever. No card required.
              </p>
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
              What&apos;s included
            </p>
            <FeatureList
              items={[
                "Full Level I plan generation",
                "1 calendar connection",
                "Gap finder — open windows in your schedule",
                "3 Calendar Coach nudges per week",
                "Basic progress tracking",
                "1 smart rebalance per week",
                "Weekly digest email"
              ]}
            />
            <div className="mt-auto pt-8">
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-full border-2 border-slate-400/90 bg-white px-5 py-3 text-center text-sm font-medium text-slate-900 transition-colors hover:border-slate-600 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-slate-400 dark:hover:bg-slate-900"
              >
                Get started free — no credit card required
              </Link>
            </div>
          </article>

          <article className="flex min-h-full flex-col rounded-2xl border-2 border-accent bg-white p-7 shadow-lg shadow-slate-900/10 ring-1 ring-accent/20 dark:border-accent dark:bg-[#141c28] dark:shadow-[0_20px_40px_-12px_rgb(0_0_0/0.5)] dark:ring-accent/30 sm:p-8">
            <div className="mb-5 text-center">
              <span className="inline-block rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-slate-800 dark:border-accent/40 dark:bg-accent/15 dark:text-emerald-100">
                Best for the full journey
              </span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                All Access
              </p>
              <p className="mt-3 flex items-baseline gap-1.5 font-display text-3xl font-medium tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                $8.25
                <span className="text-base font-normal text-slate-500 dark:text-slate-400">/month</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Billed yearly at $99. All three levels, unlimited everything.
              </p>
            </div>
            <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              What&apos;s included
            </p>
            <FeatureList
              items={[
                "Everything in Free, unlimited",
                "Unlimited calendars — work, personal, and shared all count against study time",
                "Unlimited Calendar Coach nudges",
                "Unlimited smart rebalancing",
                "Full session history, heatmap, and forecast",
                "Levels I, II & III unlocked",
                "Priority support + direct founder access"
              ]}
            />
            <div className="mt-auto pt-8">
              <AllAccessCheckoutButton
                priceId={priceAllAccess}
                className="flex w-full min-h-[2.75rem] items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:ring-offset-[#141c28]"
              >
                Get All Access — $99/year
              </AllAccessCheckoutButton>
              <p className="mt-4 text-center text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
                Less than the cost of one Schweser mock exam.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section aria-label="Trust" className="mx-auto max-w-4xl">
        <div className="grid min-h-0 gap-3 sm:grid-cols-2">
          {trustAnchors.map(({ text, icon }) => (
            <div
              key={text}
              className="flex min-h-[5.5rem] gap-3 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-4 dark:border-slate-700/70 dark:bg-slate-900/50"
            >
              <TrustIcon type={icon} />
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl scroll-mt-8 rounded-2xl border border-slate-200/85 bg-white/95 px-4 py-12 shadow-[0_1px_3px_rgb(15_23_42/0.06)] dark:border-transparent dark:bg-transparent dark:shadow-none sm:px-8 sm:py-14">
        <h2 className="text-center font-display text-[1.85rem] font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2rem]">
          Pricing FAQ
        </h2>
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200/95 bg-white/95 shadow-sm dark:border-slate-700/85 dark:bg-slate-900/65 dark:shadow-none">
          {pricingFaqs.map((faq) => (
            <details
              key={faq.q}
              className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-7"
            >
              <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center pr-8 text-left text-[0.97rem] font-medium leading-relaxed text-slate-900 marker:content-none [-webkit-tap-highlight-color:transparent] dark:text-slate-100">
                <span className="flex-1">{faq.q}</span>
                <span className="ml-2 shrink-0 text-slate-500 transition-transform duration-200 ease group-open:rotate-90 dark:text-slate-400" aria-hidden>›</span>
              </summary>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="pt-16 sm:pt-20">
        <MarketingBottomCTA
          variant="band"
          headline="Ready to start?"
          supporting="Start free and upgrade when you're ready — your plan carries over."
          primaryLabel="Create your free account"
        />
      </section>
    </div>
  );
}
