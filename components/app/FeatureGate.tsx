"use client";

import Link from "next/link";
import clsx from "clsx";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type FeatureGateProps = {
  locked: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Shows children with a lock overlay when `locked`; links to /pricing.
 * Children stay visible (dimmed) so users can see what they are missing.
 */
export function FeatureGate({ locked, children, className }: FeatureGateProps) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className={clsx("relative rounded-[inherit]", className)}>
      <div className="pointer-events-none select-none">{children}</div>
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-slate-900/50 px-4 py-6 text-center backdrop-blur-[1px] dark:bg-slate-950/60"
        aria-hidden="true"
      >
        <LockIcon className="h-8 w-8 shrink-0 text-slate-100 drop-shadow" />
        <Link
          href="/pricing"
          className="pointer-events-auto rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          Upgrade to unlock
        </Link>
      </div>
    </div>
  );
}
