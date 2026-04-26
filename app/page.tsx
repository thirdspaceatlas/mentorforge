import Link from "next/link";
import type { Metadata } from "next";
import { FeatureIcon } from "@/components/marketing/FeatureIcons";
import { HeroProductPreviews } from "@/components/marketing/HeroProductPreview";
import { MarketingBottomCTA } from "@/components/marketing/MarketingBottomCTA";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { AllAccessCheckoutButton } from "@/components/pricing/AllAccessCheckoutButton";
import { homepageFaqs } from "./faq-data";

const priceAllAccess = process.env.NEXT_PUBLIC_STRIPE_PRICE_ALL_ACCESS ?? "";

export const metadata: Metadata = {
  title: "MentorForge — CFA study planning & pacing",
  description:
    "Week-by-week CFA study plans, rebalancing, and calendar-aware progress tracking — free forever, with All Access at $99/yr for unlimited usage."
};

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
      "Enter your exam window, available hours, and start date. MentorForge builds a week-by-week CFA plan anchored to widely used study-hour benchmarks — grounded in your calendar, not guesswork.",
    icon: "plans",
    emphasis: true
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
    title: "Levels I, II & III",
    description:
      "Topic sequencing, exam weights, and level-specific study tactics update when you switch levels. Level III reflects all three registration pathways.",
    icon: "levels"
  },
  {
    title: "Calendar & progress views",
    description:
      "Choose a calendar-anchored window or follow your first incomplete week — so the planner stays where you are, not stuck on week one.",
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
  ["Build your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
  ["Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
  ["Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."]
] as const;

const trustAnchors: string[] = [
  "Built around the CFA Institute's widely cited 300+ study-hour benchmark — grounded in your calendar, not guesswork.",
  "We're early. Your feedback directly shapes what we build next — and we read every message.",
  "Free forever. No trial timer, no credit card to start.",
  "Independent study-planning software. Not affiliated with CFA Institute."
];

function PricingCheckList({ items }: { items: readonly string[] }) {
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

const featuresSectionWrapperClass =
  "mx-auto mt-8 max-w-5xl scroll-mt-8 px-4 py-12 sm:mt-10 sm:px-8 sm:py-16";

const howSectionClass =
  "mx-auto mt-12 max-w-5xl scroll-mt-28 px-4 py-12 sm:mt-14 sm:px-8 sm:py-16";

const pricingSectionClass = "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16";

const faqSectionClass = "mx-auto max-w-5xl px-4 py-12 sm:px-8 sm:py-16";

export default function LandingPage() {
  return (
    <div className="space-y-0 pb-16 sm:pb-20">
      {/* overflow-x-hidden only on hero so full-bleed bottom CTA is not clipped */}
      <section className="relative overflow-x-hidden border-b border-slate-200/70 pb-12 pt-10 dark:border-slate-800/80 sm:pb-16 sm:pt-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:max-w-2xl sm:px-6 lg:max-w-3xl">
          <p className="landing-hero-in landing-hero-d0 mb-5 font-display text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-slate-600 dark:text-slate-400">
            CFA study planning
          </p>
          <h1 className="landing-hero-in landing-hero-d1 font-display text-[clamp(1.65rem,5.5vw,3.25rem)] font-medium leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50">
            <span className="block">
              More than half of CFA candidates
              <br />
              don&apos;t pass their exam.
              <sup className="ml-0.5 align-baseline text-[0.45em] font-sans font-semibold leading-none">
                <a
                  href="#hero-footnote"
                  className="text-accent underline decoration-accent/50 underline-offset-2 transition-colors hover:text-accent hover:decoration-accent"
                >
                  ¹
                </a>
              </sup>
            </span>
            <span className="mt-2 block sm:mt-3">The ones who do have a plan.</span>
          </h1>
          <p className="landing-hero-in landing-hero-d2 mx-auto mt-8 max-w-2xl text-left text-[0.98rem] leading-relaxed text-slate-700 dark:text-slate-300 sm:text-center sm:text-[1.02rem]">
            Poor planning — not poor effort — is the silent killer of CFA attempts. MentorForge turns your exam date and available hours into a
            week-by-week study plan built for real life, so you never run out of road.
          </p>
          <div className="landing-hero-in landing-hero-d3 mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link
              href="/register"
              className="inline-flex min-h-[3rem] min-w-[11rem] touch-manipulation items-center justify-center rounded-full border border-transparent bg-slate-900 px-10 py-3.5 text-[0.9375rem] font-semibold text-white shadow-sm transition-[background-color,color,box-shadow] duration-200 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] [-webkit-tap-highlight-color:transparent] dark:border-transparent dark:bg-white dark:text-slate-950 dark:shadow-md dark:hover:bg-slate-200 dark:hover:text-slate-900 dark:focus-visible:ring-offset-slate-950"
            >
              Get started free
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-[3rem] min-w-[11.5rem] touch-manipulation items-center justify-center rounded-full border border-slate-300/95 bg-white px-10 py-3.5 text-[0.9375rem] font-semibold text-slate-900 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent] dark:border-slate-600 dark:bg-transparent dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900/40"
            >
              See how it works
            </a>
          </div>
          <p className="landing-hero-in landing-hero-d4 mx-auto mt-6 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            No credit card required. Takes less than 2 minutes to build your first plan.
          </p>
        </div>

        <div className="landing-hero-in landing-hero-d5 mt-12 sm:mt-14">
          <HeroProductPreviews />
        </div>

        <div
          id="hero-footnote"
          className="landing-hero-in landing-hero-d6 mx-auto mt-12 max-w-2xl scroll-mt-28 px-4 text-left text-[0.7rem] leading-relaxed text-slate-600 dark:text-slate-400 sm:px-6"
        >
          <p>
            <sup className="font-sans font-semibold">¹</sup> CFA Institute 10-year historical pass rate averages: 41% for Level I, 45% for Level II, 51% for Level
            III. Only an estimated 13.5% of candidates who sit Level I ultimately complete all three levels. Source:{" "}
            <a
              href="https://www.cfainstitute.org/programs/cfa-program/candidate-resources/exam-results"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
            >
              CFA Institute Exam Results &amp; Pass Rates
            </a>
            . MentorForge is independent study-planning software and is not affiliated with CFA Institute.
          </p>
        </div>
      </section>

      <RevealOnScroll>
        <div className={featuresSectionWrapperClass}>
          <section aria-labelledby="home-features-heading">
            <div className="text-center">
              <h2
                id="home-features-heading"
                className="font-display text-[clamp(1.65rem,4vw,2.15rem)] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50"
              >
                Study planning and pacing software.
                <span className="mt-1 block text-slate-700 dark:text-slate-300">Not tutoring, coaches, or a marketplace.</span>
              </h2>
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
                      (f.emphasis ? "text-slate-700 dark:text-slate-300" : "text-slate-700 dark:text-slate-400")
                    }
                  >
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </RevealOnScroll>

      <RevealOnScroll>
        <section id="how-it-works" className={howSectionClass} aria-labelledby="home-how-heading">
          <h2
            id="home-how-heading"
            className="text-center font-display text-[clamp(1.65rem,4vw,2.15rem)] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50"
          >
            Up and running in under 2 minutes.
          </h2>
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:mt-14 lg:flex lg:flex-nowrap lg:items-stretch lg:gap-0">
            {howSteps.map(([title, desc], i) => (
              <li key={title} className="flex flex-1 items-stretch">
                <div className="flex w-full flex-col lg:contents">
                  <div
                    className={
                      "flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/50 dark:shadow-none lg:min-w-0 " +
                      (i % 2 === 0 ? "lg:-rotate-[0.5deg]" : "lg:rotate-[0.5deg]")
                    }
                  >
                    <span
                      className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full bg-accent text-sm font-bold tabular-nums text-accent-foreground shadow-sm"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{desc}</p>
                  </div>
                  {i < howSteps.length - 1 && (
                    <div
                      className="hidden shrink-0 items-center self-center lg:flex"
                      style={{ width: "2rem" }}
                      aria-hidden
                    >
                      <div className="h-0.5 w-full border-t-2 border-dashed border-slate-300 dark:border-slate-600" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section className={pricingSectionClass} aria-labelledby="home-pricing-heading">
          <p className="mx-auto max-w-2xl text-center text-[0.95rem] font-medium leading-snug text-slate-800 dark:text-slate-200">
            Free forever. Upgrade to All Access when you want unlimited — or never. No trial, no countdown.
          </p>

          <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-slate-200/60 bg-white/50 px-4 py-8 dark:border-transparent dark:bg-transparent sm:px-6 sm:py-10">
            <div className="text-center">
              <h2
                id="home-pricing-heading"
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
                <PricingCheckList
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
                <PricingCheckList
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
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <ul className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-[0.95rem]">
              {trustAnchors.map((text) => (
                <li key={text} className="flex gap-3">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section className={faqSectionClass} aria-labelledby="home-faq-heading">
          <h2
            id="home-faq-heading"
            className="text-center font-display text-[clamp(1.65rem,4vw,2.15rem)] font-medium leading-snug tracking-tight text-slate-900 dark:text-slate-50"
          >
            Common questions.
          </h2>
          <div
            className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200/95 bg-white/95 shadow-sm dark:border-slate-700/85 dark:bg-[#0d1420]/80 dark:shadow-none"
            role="region"
            aria-label="Frequently asked questions"
          >
            {homepageFaqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-slate-200/85 px-6 py-5 last:border-b-0 dark:border-slate-700/70 sm:px-7"
              >
                <summary className="flex min-h-[2.75rem] cursor-pointer list-none items-center pr-8 text-left text-[0.97rem] font-semibold leading-relaxed text-slate-900 marker:content-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:text-slate-100 dark:focus-visible:ring-offset-[#0d1420]">
                  <span className="flex-1">{faq.question}</span>
                  <span className="ml-2 shrink-0 text-slate-500 transition-transform duration-200 ease group-open:rotate-90 dark:text-slate-400" aria-hidden>›</span>
                </summary>
                <p className="mt-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <section className="pt-12 sm:pt-16">
        <MarketingBottomCTA
          variant="band"
          headline="Ready to map a study runway you can defend week to week?"
          supporting="Join candidates who are done winging it."
          primaryLabel="Create your free account"
        />
      </section>
    </div>
  );
}
