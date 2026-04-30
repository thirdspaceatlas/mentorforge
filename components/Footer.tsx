"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FooterLink = { href: string; label: string };

const marketingBase: FooterLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/learn-more", label: "Learn More" },
  { href: "/privacy", label: "Privacy" }
];

const marketingSignedOutTail: FooterLink[] = [{ href: "/login", label: "Login" }];

const marketingSignedInTail: FooterLink[] = [
  { href: "/app", label: "Open app" },
  { href: "/app/account", label: "Account" }
];

const appLinks: FooterLink[] = [
  { href: "/app", label: "Study Plan" },
  { href: "/app/today", label: "Calendar Coach" },
];

export function Footer() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/app");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

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

  const footerLinks: FooterLink[] = isApp
    ? appLinks
    : [...marketingBase, ...(signedIn ? marketingSignedInTail : marketingSignedOutTail)];

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-[#fafaf9]/50 dark:border-slate-800/80 dark:bg-slate-950/50">
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 sm:py-8">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {footerLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-[2.75rem] items-center py-1 transition-colors hover:text-slate-900 [-webkit-tap-highlight-color:transparent] dark:hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-500">
          MentorForge is independent study-planning software and is not affiliated with CFA Institute, CFP Board, or any other credentialing body.
        </p>
      </div>
    </footer>
  );
}
