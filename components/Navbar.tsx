"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

const mobileNavLinkClass =
  "flex min-h-[2.75rem] items-center rounded-lg px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200/80 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:active:bg-slate-800 [-webkit-tap-highlight-color:transparent]";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const isApp = pathname?.startsWith("/app");

  // Track auth state on marketing pages so the navbar can swap "Sign in / Get
  // started" for "Open app" when the user already has a session. Without this,
  // signed-in users land on /pricing or /about and see CTAs that take them to
  // /login, which is confusing.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session?.user);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setMobileOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={
        "sticky top-0 z-50 border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200 ease-out " +
        (scrolled
          ? "border-slate-200/90 bg-[#fafaf9] shadow-nav backdrop-blur-md dark:border-white/[0.06] dark:bg-[rgba(10,15,26,0.8)] dark:shadow-nav-dark dark:backdrop-blur-[12px]"
          : "border-slate-200/40 bg-[#fafaf9]/85 backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-950/80 dark:backdrop-blur-sm")
      }
    >
      <div className="mx-auto flex h-[3.65rem] max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo priority variant="full" className="min-w-0 shrink-0" />

        <div className="flex min-w-0 items-center gap-6 md:gap-10 lg:gap-12">
          <nav className={`hidden items-center gap-5 ${isApp ? "md:flex lg:hidden" : "md:flex"} lg:gap-6`} aria-label="Main">
            {isApp ? (
              <>
                <Link
                  href="/app"
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Study Plan
                </Link>
                <Link
                  href="/app#calendar-coach"
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Calendar Coach
                </Link>
                <Link
                  href="/app/account"
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                >
                  About
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                >
                  Pricing
                </Link>
                {signedIn ? (
                  <>
                    <Link
                      href="/app/account"
                      className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                    >
                      Account
                    </Link>
                    <Link
                      href="/app"
                      className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
                    >
                      Open app
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
                    >
                      Get started free
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex min-h-[2.75rem] items-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-200/80 md:hidden dark:text-slate-200 dark:hover:bg-slate-800/80 [-webkit-tap-highlight-color:transparent]"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
            {isApp && (
              <div className="ml-1 shrink-0 scale-90 opacity-[0.88] md:ml-2">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-slate-200/90 bg-[#fafaf9]/98 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/98 md:hidden"
        >
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-0.5 px-4 py-3 sm:px-6" aria-label="Mobile">
            {isApp ? (
              <>
                <Link href="/app" className={mobileNavLinkClass} onClick={closeMobile}>
                  Study Plan
                </Link>
                <Link href="/app#calendar-coach" className={mobileNavLinkClass} onClick={closeMobile}>
                  Calendar Coach
                </Link>
                <Link href="/app/account" className={mobileNavLinkClass} onClick={closeMobile}>
                  Account
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    closeMobile();
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className={mobileNavLinkClass}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/about" className={mobileNavLinkClass} onClick={closeMobile}>
                  About
                </Link>
                <Link href="/pricing" className={mobileNavLinkClass} onClick={closeMobile}>
                  Pricing
                </Link>
                {signedIn ? (
                  <>
                    <Link href="/app/account" className={mobileNavLinkClass} onClick={closeMobile}>
                      Account
                    </Link>
                    <Link
                      href="/app"
                      className="mt-1 inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent dark:bg-white dark:text-slate-950 dark:hover:bg-accent"
                      onClick={closeMobile}
                    >
                      Open app
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="mt-1 inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent dark:bg-white dark:text-slate-950 dark:hover:bg-accent"
                      onClick={closeMobile}
                    >
                      Get started free
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex min-h-[2.75rem] items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400"
                      onClick={closeMobile}
                    >
                      Log in
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
