"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/supabase/use-supabase-user";

const navItems = [
  { href: "/app", label: "Plan", icon: PlanIcon },
  { href: "/app/today", label: "Calendar Coach", icon: CalendarIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useSupabaseUser();
  const [examDate, setExamDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study-plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.plan?.examDate === "string") setExamDate(d.plan.examDate);
      })
      .catch(() => {});
  }, []);

  const sitting = examDate ? formatSitting(examDate) : null;
  const fullName = displayName(user);
  const initials = computeInitials(user);

  const accountActive = pathname?.startsWith("/app/account") ?? false;
  const userRowLabel = fullName || "Account";

  return (
    <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r lg:border-hair lg:bg-paper dark:lg:border-slate-800/80 dark:lg:bg-slate-950">
      {/* SITTING — anchored at top. Top margin = right column's py − tile's
          internal p-3 (12px), so the SITTING text inside aligns with the PLAN
          eyebrow on the right, not just the tile's outer border. */}
      {sitting && (
        <div className="mx-3 mb-6 mt-5 rounded-lg border border-hair bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:mt-11">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Sitting
          </p>
          <p className="mt-1 font-display text-[22px] font-medium leading-tight tracking-tight text-ink dark:text-slate-100">
            {sitting.label}
          </p>
          {sitting.weeksRemaining > 0 && (
            <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
              {sitting.weeksRemaining} week
              {sitting.weeksRemaining === 1 ? "" : "s"} remaining
            </p>
          )}
        </div>
      )}

      <nav
        className={
          "flex-1 space-y-0.5 px-3 pb-6 " +
          (sitting ? "pt-0" : "pt-8 sm:pt-14")
        }
        aria-label="App"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/app" ? pathname === "/app" : pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={
                "relative flex min-h-[2.5rem] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
                (isActive
                  ? "bg-white font-semibold text-ink dark:bg-slate-800/60 dark:text-slate-100"
                  : "font-medium text-slate-600 hover:bg-white/60 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200")
              }
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-amber-mf"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User row — doubles as the Account link. Falls back to "Account"
          when the user hasn't entered a name. */}
      <Link
        href="/app/account"
        className={
          "relative mx-3 mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors " +
          (accountActive
            ? "bg-white font-semibold text-ink dark:bg-slate-800/60 dark:text-slate-100"
            : "font-medium text-slate-700 hover:bg-white/60 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800/40 dark:hover:text-slate-200")
        }
        aria-label={`Account · ${userRowLabel}`}
      >
        {accountActive && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-amber-mf"
          />
        )}
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[11px] font-medium text-white dark:bg-slate-200 dark:text-slate-900"
        >
          {initials}
        </span>
        <span className="truncate text-[12.5px]">{userRowLabel}</span>
      </Link>

      <div className="border-t border-hair px-3 py-4 dark:border-slate-800/80">
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

/* ─── Helpers ─── */

type SupabaseUserLike = {
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
} | null;

function displayName(user: SupabaseUserLike): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  if (meta.full_name) return meta.full_name;
  if (meta.name) return meta.name;
  if (meta.first_name && meta.last_name) {
    return `${meta.first_name} ${meta.last_name}`;
  }
  if (meta.first_name) return meta.first_name;
  if (user.email) return user.email.split("@")[0];
  return "";
}

function computeInitials(user: SupabaseUserLike): string {
  if (!user) return "·";
  const meta = user.user_metadata ?? {};

  // Best signal: explicit first + last from metadata.
  if (meta.first_name && meta.last_name) {
    return (meta.first_name[0] + meta.last_name[0]).toUpperCase();
  }

  // Multi-word full_name / name → first letter of first + last word.
  const candidate = meta.full_name ?? meta.name ?? "";
  if (candidate) {
    const parts = candidate.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Single-word name: try the email's dotted local-part for a second letter
    // (e.g. "david" + "david.blackwealth@..." → "DB" not "DA").
    const fromEmail = emailInitials(user.email);
    if (fromEmail) return fromEmail;
    return parts[0].slice(0, 2).toUpperCase();
  }

  // No name at all — fall back to the email entirely.
  const fromEmail = emailInitials(user.email);
  if (fromEmail) return fromEmail;
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "·";
}

function emailInitials(email?: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0];
  const tokens = local.split(/[._\-+]/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).toUpperCase();
  }
  return null;
}

function formatSitting(
  examDateIso: string
): { label: string; weeksRemaining: number } | null {
  // examDateIso is YYYY-MM-DD; parse as local midnight to avoid TZ drift.
  const [y, m, d] = examDateIso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const exam = new Date(y, m - 1, d);
  const now = new Date();
  const diffMs = exam.getTime() - now.getTime();
  const weeksRemaining = Math.max(0, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
  const label = exam.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return { label, weeksRemaining };
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

