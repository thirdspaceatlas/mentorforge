import Link from "next/link";

type MarketingBottomCTAProps = {
  headline: string;
  supporting?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  showDisclaimer?: boolean;
  /** `card` = rounded bordered box; `band` = full-bleed strip (conversion end-cap) */
  variant?: "card" | "band";
};

export function MarketingBottomCTA({
  headline,
  supporting,
  primaryLabel = "Create your free account",
  primaryHref = "/register",
  secondaryLabel,
  secondaryHref = "/learn-more",
  showDisclaimer = true,
  variant = "card"
}: MarketingBottomCTAProps) {
  if (variant === "band") {
    return (
      <section
        className="relative ml-[calc(50%-50vw)] w-screen max-w-[100vw] shrink-0 border-y border-slate-200/80 bg-[#ebe8e2] px-4 py-16 dark:border-slate-800/60 dark:bg-[#0d1420] sm:px-8 sm:py-20"
        aria-label="Call to action"
      >
        <div className="mx-auto max-w-3xl px-2 text-center sm:px-4">
          <p className="font-display text-[2rem] font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.35rem] md:text-[2.65rem]">
            {headline}
          </p>
          {supporting && (
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[0.95rem]">
              {supporting}
            </p>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12">
            <Link
              href={primaryHref}
              className="inline-flex min-h-[2.75rem] min-w-[12rem] touch-manipulation items-center justify-center rounded-full bg-amber-mf px-10 py-3.5 text-sm font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe8e2] [-webkit-tap-highlight-color:transparent] dark:focus-visible:ring-offset-[#0d1420]"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex min-h-[2.75rem] min-w-[10rem] touch-manipulation items-center justify-center rounded-full border border-slate-400/90 bg-white/90 px-8 py-3.5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [-webkit-tap-highlight-color:transparent] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-slate-500"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
          {showDisclaimer && (
            <p className="mx-auto mt-10 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200/80 bg-[#f4f1ec]/90 px-5 py-12 text-center shadow-sm dark:border-slate-700/60 dark:bg-gradient-to-b dark:from-[#151b28] dark:to-[#0f1522] dark:shadow-none sm:px-10 sm:py-16">
      <p className="font-display text-[1.95rem] font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.15rem]">
        {headline}
      </p>
      {supporting && (
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {supporting}
        </p>
      )}
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href={primaryHref}
          className="inline-flex min-h-[2.75rem] min-w-[10rem] touch-manipulation items-center justify-center rounded-full bg-amber-mf px-8 py-3.5 text-sm font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-mf focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ec] [-webkit-tap-highlight-color:transparent] dark:focus-visible:ring-offset-[#151b28]"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-[2.75rem] min-w-[10rem] touch-manipulation items-center justify-center rounded-full border border-slate-300/90 bg-white/90 px-8 py-3.5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [-webkit-tap-highlight-color:transparent] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-slate-500"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {showDisclaimer && (
        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
        </p>
      )}
    </section>
  );
}
