import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "./providers";
import { SiteNav } from "../components/SiteNav";

export const metadata: Metadata = {
  title: "MentorForge",
  description:
    "Plan, pace, and rebalance your study path for serious exams and certifications.",
  applicationName: "MentorForge"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <Link
                href="/"
                className="group flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-[15px] font-bold text-white shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30 dark:shadow-sky-950/40 dark:ring-sky-500/20"
                  aria-hidden
                >
                  MF
                </span>
                <span className="text-xl font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-400">
                  MentorForge
                </span>
              </Link>
              <SiteNav />
            </header>
            <main className="flex flex-1 justify-center px-4 py-6">
              <div className="w-full max-w-3xl">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
