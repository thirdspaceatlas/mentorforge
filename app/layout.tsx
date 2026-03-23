import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "./providers";
import { SiteNav } from "../components/SiteNav";
import { fontDisplay, fontSans } from "./fonts";

export const metadata: Metadata = {
  title: "MentorForge",
  description:
    "Plan, pace, and rebalance your study path for serious exams and certifications.",
  applicationName: "MentorForge"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable}`}
    >
      <body className="min-h-screen bg-[#fafaf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#fafaf9]/90 px-5 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-8">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                <Link
                  href="/"
                  className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300/90 bg-white text-xs font-semibold tracking-tight text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    aria-hidden
                  >
                    MF
                  </span>
                  <span className="font-display text-2xl font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700 dark:text-slate-100 dark:group-hover:text-slate-200">
                    MentorForge
                  </span>
                </Link>
                <SiteNav />
              </div>
            </header>
            <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-14">
              <div className="w-full max-w-5xl">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
