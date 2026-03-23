"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function SiteNav() {
  const pathname = usePathname();
  const isInsideApp = pathname?.startsWith("/app");

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      {!isInsideApp && (
        <Link
          href="/login"
          className="rounded-full border border-slate-300/90 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900/80"
        >
          Log in
        </Link>
      )}
    </div>
  );
}
