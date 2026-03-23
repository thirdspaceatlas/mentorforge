import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fafaf9]/80 backdrop-blur-sm supports-[backdrop-filter]:bg-[#fafaf9]/72 dark:border-slate-700/75 dark:bg-slate-950/90 dark:backdrop-blur-sm dark:supports-[backdrop-filter]:bg-slate-950/85">
      <div className="mx-auto flex h-[3.65rem] max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo priority variant="full" className="shrink-0" />

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <nav className="hidden items-center gap-6 md:flex">
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
              href="/login"
              className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
            >
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
