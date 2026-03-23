import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Navbar } from "../components/Navbar";
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
      <body className="min-h-screen bg-[#fafaf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 sm:py-14">
              <div className="w-full max-w-5xl">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
