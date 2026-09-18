import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ogImage } from "@/lib/og";
import { getSiteUrl } from "@/lib/site";
import { Providers } from "./providers";
import { Footer } from "../components/Footer";
import { AppWaitlistBanner } from "../components/marketing/AppWaitlistBanner";
import { Navbar } from "../components/Navbar";
import { fontDisplay, fontMono, fontSans } from "./fonts";

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MentorForge",
    statusBarStyle: "default"
  },
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
  viewportFit: "cover",
  themeColor: "#0f1f4a"
};

const plausibleDomain =
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || getSiteUrl().hostname;

/** Custom events + props (see lib/analytics.ts). Loaded after hydration so it never blocks first paint. */
const plausibleScriptSrc =
  "https://plausible.io/js/script.pageview-props.tagged-events.js";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden bg-[#fafaf9] text-slate-900 dark:bg-slate-950 dark:text-slate-100 dark:antialiased">
        <Script
          defer
          data-domain={plausibleDomain}
          src={plausibleScriptSrc}
          strategy="afterInteractive"
        />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <AppWaitlistBanner />
            <main className="flex w-full min-w-0 flex-1 justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-14 sm:pb-14">
              <div className="w-full min-w-0 max-w-[1200px]">{children}</div>
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
