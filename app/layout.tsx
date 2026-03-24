import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { fontDisplay, fontSans } from "./fonts";

export const metadata: Metadata = {
  title: "MentorForge",
  description:
    "Plan, pace, and rebalance your study path for serious exams and certifications.",
  applicationName: "MentorForge"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
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
            <main className="flex w-full min-w-0 flex-1 justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-14 sm:pb-14">
              <div className="w-full min-w-0 max-w-5xl">{children}</div>
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
