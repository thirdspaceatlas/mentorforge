"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMarketing = !pathname?.startsWith("/app");

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={!isMarketing}
        forcedTheme={isMarketing ? "light" : undefined}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
