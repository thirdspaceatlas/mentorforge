"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/app", label: "Study Plan", icon: PlanIcon },
  { href: "/app#calendar-coach", label: "Calendar Coach", icon: CalendarIcon },
  { href: "/app/account", label: "Account", icon: AccountIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-[#fafaf9] dark:lg:border-slate-800/80 dark:lg:bg-slate-950">
      <nav className="flex-1 space-y-0.5 px-3 py-6" aria-label="App">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/app"
            ? pathname === "/app"
            : pathname?.startsWith(href.split("#")[0]);

          return (
            <Link
              key={href}
              href={href}
              className={
                "flex min-h-[2.5rem] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 px-3 py-4 dark:border-slate-800/80">
        <div className="flex items-center justify-between px-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── Icons ─── */

function PlanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 5h6M5 8h4M5 11h5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 7h12M5 1v4M11 1v4" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    </svg>
  );
}
