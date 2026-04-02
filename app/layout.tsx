import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ogImage } from "@/lib/og";
import { getSiteUrl } from "@/lib/site";
import { Providers } from "./providers";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { fontDisplay, fontSans } from "./fonts";

const siteDescription =
  "Plan, pace, and rebalance your study path for serious exams and certifications.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "MentorForge",
    template: "%s — MentorForge"
  },
  description: siteDescription,
  applicationName: "MentorForge",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MentorForge",
    title: "MentorForge",
    description: siteDescription,
    url: "/",
    images: [
      {
        url: ogImage.path,
        width: ogImage.width,
        height: ogImage.height,
        alt: ogImage.alt
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MentorForge",
    description: siteDescription,
    images: [ogImage.path]
  }
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
      className={`scroll-smooth ${fontSans.variable} ${fontDisplay.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden bg-[#fafaf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex w-full min-w-0 flex-1 justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-14 sm:pb-14">
              <div className="w-full min-w-0 max-w-[1200px]">{children}</div>
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
