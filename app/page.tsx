import Link from "next/link";
import type { Metadata } from "next";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { AllAccessCheckoutButton } from "@/components/pricing/AllAccessCheckoutButton";
import { homepageFaqs } from "./faq-data";

const priceAllAccess = process.env.NEXT_PUBLIC_STRIPE_PRICE_ALL_ACCESS ?? "";

export const metadata: Metadata = {
  title: "MentorForge — CFA study planning & pacing",
  description:
    "Week-by-week CFA study plans, rebalancing, and calendar-aware progress tracking — free forever, with All Access at $99/yr for unlimited usage.",
};

const howSteps = [
  ["Enter your details", "Pick your CFA level, exam window, start date, and weekly hours."],
  ["Build your plan", "MentorForge sequences topics by exam weight, spaces ethics reviews, and prorates partial weeks."],
  ["Study & track", "Log actual hours each week. Mark weeks complete. Rebalance if you fall behind."],
  ["Stay on pace", "Your summary, plan status, readiness note, and focus window stay aligned as you log hours and move through the weeks."],
] as const;

const features = [
  {
    title: "Realistic weekly plans",
    desc: "Calendar-anchored from your exam window, available hours, and start date — grounded in widely used study-hour benchmarks, not guesswork.",
  },
  {
    title: "Smart rebalancing",
    desc: "Log actual hours when life gets in the way. Missed load rolls forward into remaining weeks so your runway stays honest and achievable.",
  },
  {
    title: "Progress tracking",
    desc: "Mark weeks complete, scan status pills, and watch your plan status and readiness narrative stay in sync with what you log.",
  },
  {
    title: "Levels I, II & III",
    desc: "Topic sequencing, exam weights, and level-specific tactics update when you switch levels. Level III reflects all three pathways.",
  },
  {
    title: "Calendar & progress views",
    desc: "Choose a calendar-anchored window or follow your first incomplete week — so the planner stays where you are, not stuck on week one.",
  },
  {
    title: "Ethics & review spacing",
    desc: "Ethics appears at sensible intervals, review checkpoints slot in for longer plans, and heavier topics can get a second pass before the exam.",
  },
] as const;

const trustAnchors: string[] = [
  "Built around the CFA Institute's widely cited 300+ study-hour benchmark.",
  "We're early. Your feedback directly shapes what we build next.",
  "Free forever. No trial timer, no credit card to start.",
  "Independent study-planning software. Not affiliated with CFA Institute.",
];

export default function LandingV2() {
  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] w-screen bg-paper sm:-my-14">
      {/* HERO — asymmetric (v1 look), 2 floating previews on right */}
      <section className="relative overflow-x-hidden px-4 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:pt-20">
        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <p className="landing-hero-in landing-hero-d0 flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-mf">
              <span aria-hidden className="inline-block h-px w-5 bg-amber-mf" />
              CFA Study Planning, Made Calm
            </p>
            <h1 className="landing-hero-in landing-hero-d1 mt-4 text-balance font-display text-[clamp(1.85rem,5.5vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-slate-900">
              More than half of CFA candidates don&apos;t pass their exam.
              <sup className="ml-0.5 align-baseline text-[0.42em] font-sans font-semibold leading-none">
                <a
                  href="#hero-footnote"
                  className="text-amber-mf underline decoration-amber-mf/40 underline-offset-2 transition-colors hover:decoration-amber-mf"
                  aria-label="See pass-rate source"
                >
                  ¹
                </a>
              </sup>
              <span className="mt-3 block">The ones who do have a plan.</span>
            </h1>
            <p className="landing-hero-in landing-hero-d2 mt-7 max-w-xl text-[1rem] leading-relaxed text-slate-700">
              Poor planning — not poor effort — is the silent killer of CFA
              attempts. MentorForge turns your exam date and available hours
              into a week-by-week study plan built for real life, so you never
              run out of road.
            </p>
            <div className="landing-hero-in landing-hero-d3 mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-amber-mf px-7 py-3.5 text-[0.95rem] font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-paper [-webkit-tap-highlight-color:transparent]"
              >
                Get started — free
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2.5 7h9M8 3l4 4-4 4" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-slate-300 bg-white/70 px-7 py-3.5 text-[0.95rem] font-medium text-slate-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [-webkit-tap-highlight-color:transparent]"
              >
                See how it works
              </a>
            </div>
            <p className="landing-hero-in landing-hero-d4 mt-5 text-xs leading-relaxed text-slate-600">
              No credit card. Under 2 minutes to your first plan.
            </p>

            {/* Footnote (Option D) — left-aligned in left column,
                under "no credit card" caption. Pairs with the ¹ above. */}
            <p
              id="hero-footnote"
              className="landing-hero-in landing-hero-d6 mt-8 max-w-xl scroll-mt-28 border-t border-slate-200/70 pt-5 text-[0.72rem] leading-relaxed text-slate-600"
            >
              <sup className="font-sans font-semibold">¹</sup> CFA Institute
              10-year historical pass-rate averages: 41% Level I, 45% Level II,
              51% Level III. Only an estimated 13.5% of Level I candidates
              ultimately complete all three levels. Source:{" "}
              <a
                href="https://www.cfainstitute.org/programs/cfa-program/candidate-resources/exam-results"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-mf underline decoration-amber-mf/40 underline-offset-2 transition-colors hover:decoration-amber-mf"
              >
                CFA Institute Exam Results &amp; Pass Rates
              </a>
              . Independent study-planning software; not affiliated with CFA
              Institute.
            </p>
          </div>

          {/* TWO floating previews — paired, vertically centered against h1 (Option A) */}
          <div className="landing-hero-in landing-hero-d5 relative lg:self-center">
            <FloatingPreviewPair />
          </div>
        </div>
      </section>

      {/* 3-STAT EDITORIAL ROW — slate big numbers, no amber */}
      <RevealOnScroll>
        <section className="border-y border-slate-200/70 bg-white/40 px-4 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-y-10 gap-x-12 sm:grid-cols-3">
            <Stat n="300h" label="recommended per level" hint="CFA Institute" />
            <Stat n="13.5%" label="finish all three levels" hint="within four years" />
            <Stat n="18 wk" label="average runway" hint="across MentorForge plans" />
          </div>
        </section>
      </RevealOnScroll>

      {/* FEATURES — restored "Study planning and pacing software." headline,
          softer 2-col editorial layout, no cards/tiles/icons */}
      <RevealOnScroll>
        <section
          id="features"
          className="px-4 py-16 sm:px-8 sm:py-20"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-[1200px]">
            <div className="max-w-3xl">
              <h2
                id="features-heading"
                className="text-balance font-display text-[clamp(1.65rem,4vw,2.35rem)] font-medium leading-[1.18] tracking-tight text-slate-900"
              >
                Study planning and pacing software.
                <span className="mt-1.5 block text-slate-700">
                  Not tutoring, coaches, or a marketplace.
                </span>
              </h2>
            </div>

            {/* G: hairline rules between feature rows  ·  H: mono numbering  ·  I: vertical column rule */}
            <div className="mt-12 grid sm:grid-cols-2">
              {features.map((f, i) => {
                const isFirstRow = i < 2;
                const isLeftCol = i % 2 === 0;
                return (
                  <div
                    key={f.title}
                    className={
                      "max-w-md py-8 sm:py-10 " +
                      (isFirstRow ? "" : "border-t border-slate-200/70 ") +
                      (isLeftCol ? "sm:pr-10" : "sm:border-l sm:border-slate-200/70 sm:pl-10")
                    }
                  >
                    <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-display text-[1.3rem] font-medium leading-snug tracking-tight text-slate-900">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-[0.97rem] leading-relaxed text-slate-700">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* HOW IT WORKS — soft mono-numbered steps, no rotated tiles */}
      <RevealOnScroll>
        <section
          id="how-it-works"
          className="border-t border-slate-200/70 px-4 py-16 sm:px-8 sm:py-20"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-[1200px]">
            <h2
              id="how-heading"
              className="max-w-3xl font-display text-[clamp(1.65rem,4vw,2.35rem)] font-medium leading-[1.18] tracking-tight text-slate-900"
            >
              Up and running in under 2 minutes.
            </h2>

            {/* I: vertical column rules separate steps on desktop, hairline rules between row pairs on tablet */}
            <ol className="mt-12 grid gap-y-10 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-4 lg:gap-y-0">
              {howSteps.map(([title, desc], i) => {
                const isLeftMobile = i % 2 === 0;
                const isFirstLg = i === 0;
                return (
                  <li
                    key={title}
                    className={
                      "py-1 " +
                      // Tablet column rules between sibling pairs
                      (isLeftMobile ? "sm:pr-10 lg:pr-0" : "sm:pl-10 sm:border-l sm:border-slate-200/70 lg:pl-0 lg:border-l-0") +
                      // Desktop: vertical hairline before every step except the first
                      (isFirstLg ? "" : " lg:border-l lg:border-slate-200/70 lg:pl-8") +
                      (isFirstLg ? "" : " lg:ml-0") +
                      " lg:pr-8"
                    }
                  >
                    <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Step {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 font-display text-[1.15rem] font-medium leading-snug tracking-tight text-slate-900">
                      {title}
                    </p>
                    <p className="mt-2.5 text-[0.92rem] leading-relaxed text-slate-700">
                      {desc}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </RevealOnScroll>

      {/* PRICING — Free + dark ink All Access */}
      <RevealOnScroll>
        <section
          id="pricing"
          className="border-t border-slate-200/70 px-4 py-16 sm:px-8 sm:py-20"
          aria-labelledby="pricing-heading"
        >
          <div className="mx-auto max-w-[1200px]">
            <p className="mx-auto max-w-2xl text-center text-[0.95rem] font-medium leading-snug text-slate-800">
              Free forever. Upgrade to All Access when you want unlimited — or
              never. No trial, no countdown.
            </p>
            <h2
              id="pricing-heading"
              className="mt-5 text-balance text-center font-display text-[clamp(1.65rem,4vw,2.15rem)] font-medium leading-snug tracking-tight text-slate-900"
            >
              Pricing tiers
            </h2>

            <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-5">
              {/* FREE TIER */}
              <article className="flex min-h-full flex-col rounded-2xl border border-slate-200/95 bg-white p-7 shadow-sm sm:p-8">
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight text-slate-900">
                    Free
                  </p>
                  <p className="mt-3 font-display text-3xl font-medium tabular-nums tracking-tight text-slate-900">
                    $0
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Free forever. No card required.
                  </p>
                </div>
                <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-500">
                  What&apos;s included
                </p>
                <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {[
                    "Full Level I plan generation",
                    "1 calendar connection",
                    "Gap finder — open windows in your schedule",
                    "3 Calendar Coach nudges per week",
                    "Basic progress tracking",
                    "1 smart rebalance per week",
                    "Weekly digest email",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link
                    href="/register"
                    className="flex w-full min-h-[2.75rem] items-center justify-center rounded-full border-2 border-slate-400/90 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:border-slate-600 hover:bg-slate-50"
                  >
                    Get started free — no credit card required
                  </Link>
                </div>
              </article>

              {/* ALL ACCESS — dark ink + amber chip + amber CTA */}
              <article className="relative flex min-h-full flex-col overflow-hidden rounded-2xl bg-ink p-7 shadow-[0_18px_44px_rgb(14_26_43_/_0.18)] sm:p-8">
                <div className="mb-5 text-center">
                  <span className="inline-block rounded-full bg-amber-mf px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink">
                    Best for the full journey
                  </span>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight text-amber-mf">
                    All Access
                  </p>
                  <p className="mt-3 flex items-baseline gap-1.5 font-display text-3xl font-medium tabular-nums tracking-tight text-white">
                    $8.25
                    <span className="text-base font-normal text-slate-400">
                      /month
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    Billed yearly at $99. All three levels, unlimited
                    everything.
                  </p>
                </div>
                <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-slate-400">
                  What&apos;s included
                </p>
                <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-slate-200">
                  {[
                    "Everything in Free, unlimited",
                    "Unlimited calendars — work, personal, and shared all count against study time",
                    "Unlimited Calendar Coach nudges",
                    "Unlimited smart rebalancing",
                    "Full session history, heatmap, and forecast",
                    "Levels I, II & III unlocked",
                    "Priority support + direct founder access",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-mf" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <AllAccessCheckoutButton
                    priceId={priceAllAccess}
                    className="flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-full bg-amber-mf px-5 py-3 text-sm font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    Get All Access — $99/year
                  </AllAccessCheckoutButton>
                  <p className="mt-4 text-center text-sm font-medium leading-snug text-slate-300">
                    Less than the cost of one Schweser mock exam.
                  </p>
                </div>
              </article>
            </div>

            {/* Trust anchors below pricing */}
            <ul className="mx-auto mt-14 max-w-2xl space-y-3 text-[0.92rem] leading-relaxed text-slate-700">
              {trustAnchors.map((text) => (
                <li key={text} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-mf" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </RevealOnScroll>

      {/* FAQ */}
      <RevealOnScroll>
        <section
          id="faq"
          className="border-t border-slate-200/70 px-4 py-16 sm:px-8 sm:py-20"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto max-w-[1200px]">
            {/* K: centered heading (matches Pricing alignment pattern) */}
            <h2
              id="faq-heading"
              className="text-balance text-center font-display text-[clamp(1.65rem,4vw,2.35rem)] font-medium leading-snug tracking-tight text-slate-900"
            >
              Common questions.
            </h2>

            {/* J: soft white card wrapper — gives FAQ section anchor weight, like the original */}
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200/70 bg-white/70 px-1 shadow-sm sm:px-2">
              {homepageFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group border-b border-slate-200/70 px-5 py-5 last:border-b-0 sm:px-7"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 pr-2 text-left text-[1rem] font-semibold leading-snug text-slate-900 marker:content-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
                    <span className="flex-1">{faq.question}</span>
                    <span
                      aria-hidden
                      className="shrink-0 text-slate-400 transition-transform duration-200 ease group-open:rotate-90"
                    >
                      ›
                    </span>
                  </summary>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-slate-700">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* CLOSER — full-bleed dark ink, amber CTA */}
      <section
        className="bg-ink px-4 py-20 sm:px-8 sm:py-24"
        aria-label="Call to action"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-balance font-display text-[clamp(1.85rem,4.5vw,2.85rem)] font-medium leading-[1.12] tracking-tight text-white">
            Map a study runway you can defend week to week.
          </p>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-300">
            Join candidates who are done winging it.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-amber-mf px-8 py-3.5 text-[0.95rem] font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-ink [-webkit-tap-highlight-color:transparent]"
            >
              Build your free account
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2.5 7h9M8 3l4 4-4 4" />
              </svg>
            </Link>
          </div>
          <p className="mx-auto mt-8 max-w-md text-xs leading-relaxed text-slate-500">
            No credit card. Independent study-planning software, not affiliated
            with CFA Institute.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ─── Bits ─── */

function Stat({
  n,
  label,
  hint,
}: {
  n: string;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="font-display text-[clamp(2.25rem,5vw,3rem)] font-medium leading-none tracking-tight text-slate-900">
        {n}
      </p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {hint && (
        <p className="mt-1.5 text-[12.5px] italic text-slate-500">{hint}</p>
      )}
    </div>
  );
}

/**
 * Two paired floating preview cards in the hero — primary (Next session +
 * allocation) on top, secondary (Today's docket excerpt) tucked below-right.
 * Editorial mocks; not interactive.
 */
function FloatingPreviewPair() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 -z-10 rounded-3xl bg-amber-mf-soft/40 blur-2xl"
        aria-hidden
      />

      {/* Primary card — Next session + allocation */}
      <div className="relative z-10 rounded-2xl border border-slate-200/95 bg-white p-5 shadow-[0_18px_44px_rgb(14_26_43_/_0.10)] sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
            <span aria-hidden className="inline-block h-px w-3 bg-amber-mf" />
            Next Study Session
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-slate-500">
            Tue · 12 May 2026
          </p>
        </div>
        <h3 className="mt-3 font-display text-[1.6rem] font-medium leading-[1.05] tracking-tight text-slate-900">
          Equity Investments<span className="text-slate-400">.</span>
        </h3>
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-slate-600">
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="5.5" cy="5.5" r="4.25" />
            <path d="M5.5 3v2.5l1.5 1" />
          </svg>
          <span>
            45 min
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono">4:45 PM</span>
            <span className="mx-1.5 text-slate-300">·</span>
            Reading 23 · DCF practice
          </span>
        </div>

        <div className="mt-5 border-t border-slate-200/80 pt-4">
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="font-mono font-bold uppercase tracking-[0.1em] text-slate-500">
              Today&apos;s allocation
            </span>
            <span className="flex items-baseline gap-1">
              <span className="font-display text-sm font-medium text-slate-900">
                1h 30m
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                / 2h 15m
              </span>
            </span>
          </div>
          <div className="relative mt-2 h-1.5 overflow-visible rounded bg-paper">
            <div className="h-full w-[67%] rounded bg-ink" />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-amber-mf shadow-[0_2px_6px_rgb(201_132_43_/_0.4)]"
              style={{ left: "calc(67% - 6px)" }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Secondary card — Today's docket excerpt.
          Mobile: stacks cleanly below primary (mt-6, full width).
          Desktop (lg+): tucks bottom-right with offset overlap. */}
      <div
        className="relative z-0 mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_28px_rgb(14_26_43_/_0.08)] sm:p-6 lg:-mt-6 lg:ml-auto lg:w-[88%]"
      >
        <p className="flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-amber-mf">
          <span aria-hidden className="inline-block h-px w-3 bg-amber-mf" />
          Today&apos;s Docket
        </p>
        <p className="mt-2 font-display text-[1.15rem] font-medium leading-snug tracking-tight text-slate-900">
          Five sessions. <span className="text-slate-400">·</span> Three done.
        </p>

        {/* mini ribbon — abstracted */}
        <div className="relative mt-4 h-9">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" aria-hidden />
          <div className="absolute left-0 top-1/2 h-[2px] w-[55%] -translate-y-1/2 rounded bg-slate-900" aria-hidden />
          <div
            className="absolute top-[5px] flex h-6 items-center rounded bg-slate-900 px-2 text-[9px] font-mono font-bold uppercase tracking-wide text-white"
            style={{ left: "8%" }}
          >
            ✓ 07:30
          </div>
          <div
            className="absolute top-[5px] flex h-6 items-center rounded bg-slate-900 px-2 text-[9px] font-mono font-bold uppercase tracking-wide text-white"
            style={{ left: "32%" }}
          >
            ✓ 12:30
          </div>
          <div
            className="absolute top-[5px] flex h-6 items-center rounded bg-amber-mf px-2 text-[9px] font-mono font-bold uppercase tracking-wide text-ink shadow-[0_4px_10px_rgb(201_132_43_/_0.4)]"
            style={{ left: "60%" }}
          >
            ◆ 16:45
          </div>
        </div>
      </div>

      <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
        ◇ A look at your dashboard, on day one
      </p>
    </div>
  );
}
