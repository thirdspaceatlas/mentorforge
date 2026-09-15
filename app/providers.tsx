"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AmplitudeInit } from "@/components/analytics/AmplitudeInit";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // App surfaces (/app/*) and dev previews (/dev/*) honor system theme so
  // dark mode is testable end-to-end. Marketing pages stay forced-light.
  const isThemeable =
    !!pathname?.startsWith("/app") || !!pathname?.startsWith("/dev");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={isThemeable}
      forcedTheme={isThemeable ? undefined : "light"}
    >
      <AmplitudeInit />
      {children}
    </ThemeProvider>
  );
}
