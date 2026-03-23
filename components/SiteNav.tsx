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
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Log in
        </Link>
      )}
    </div>
  );
}
