/** Minimal monoline icons for homepage feature grid — stroke uses currentColor (accent via parent). */

export function FeatureIcon({ name }: { name: string }) {
  const common = "h-6 w-6 shrink-0 text-accent";
  switch (name) {
    case "plans":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 6h16M4 12h10M4 18h6" strokeLinecap="round" />
          <rect x="14" y="10" width="6" height="8" rx="1" />
        </svg>
      );
    case "levels":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 7h10v10H7z" />
          <path d="M9 4h10v10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rebalance":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 14v4h4M20 10V6h-4" strokeLinecap="round" />
          <path d="M5 18a8 8 0 0013.3-3M19 6a8 8 0 00-13.3-3" strokeLinecap="round" />
        </svg>
      );
    case "progress":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 19h16" strokeLinecap="round" />
          <path d="M7 16l3-6 4 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      );
    case "ethics":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
