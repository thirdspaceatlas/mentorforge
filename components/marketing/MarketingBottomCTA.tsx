import Link from "next/link";

type MarketingBottomCTAProps = {
  headline: string;
  supporting?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  showDisclaimer?: boolean;
};

export function MarketingBottomCTA({
  headline,
  supporting,
  primaryLabel = "Create your free account",
  primaryHref = "/register",
  secondaryLabel,
  secondaryHref = "/learn-more",
  showDisclaimer = true
}: MarketingBottomCTAProps) {
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
          className="inline-flex min-h-[2.75rem] min-w-[10rem] touch-manipulation items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ec] [-webkit-tap-highlight-color:transparent] dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground dark:focus-visible:ring-offset-[#151b28]"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-[2.75rem] min-w-[10rem] touch-manipulation items-center justify-center rounded-full border border-slate-300/90 bg-white/90 px-8 py-3.5 text-sm font-medium text-slate-800 transition-colors hover:border-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 [-webkit-tap-highlight-color:transparent] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-slate-500"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
      {showDisclaimer && (
        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          No credit card required. MentorForge is independent study-planning software and is not affiliated with CFA Institute.
        </p>
      )}
    </section>
  );
}
