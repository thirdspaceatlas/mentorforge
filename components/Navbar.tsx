"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-200 " +
        (scrolled
          ? "border-slate-200/90 bg-[#fafaf9] shadow-nav backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-950/90 dark:backdrop-blur-md dark:shadow-nav-dark"
          : "border-slate-200/40 bg-[#fafaf9]/85 backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-950/80 dark:backdrop-blur-sm")
      }
    >
      <div className="mx-auto flex h-[3.65rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo priority variant="full" className="min-w-0 shrink-0" />

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-5 md:flex lg:gap-6">
            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-accent dark:hover:text-accent-foreground"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 underline decoration-slate-300/90 underline-offset-4 transition-colors hover:text-slate-900 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-100"
            >
              Log in
            </Link>
          </nav>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent dark:bg-white dark:text-slate-950 dark:hover:bg-accent"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 dark:text-slate-400"
              >
                Log in
              </Link>
            </div>
            <div className="ml-1 shrink-0 scale-90 opacity-[0.88] md:ml-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
