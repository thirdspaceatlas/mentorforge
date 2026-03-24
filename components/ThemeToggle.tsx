"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function ThemeSkeleton() {
  return (
    <div className="h-9 w-[4.25rem] rounded-full border border-slate-200/90 bg-white/85 dark:border-slate-600/80 dark:bg-slate-900/85" />
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ThemeSkeleton />;
  }

  const isLight = resolvedTheme !== "dark";

  return (
    <div
      className="flex touch-manipulation items-center rounded-full border border-slate-200/90 bg-white/90 p-0.5 shadow-sm dark:border-slate-600/80 dark:bg-slate-900/85 [-webkit-tap-highlight-color:transparent]"
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        aria-pressed={isLight}
        className={
          "min-h-[2.25rem] min-w-[2.25rem] rounded-full p-2 transition-colors " +
          (isLight
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
        }
      >
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        aria-pressed={!isLight}
        className={
          "min-h-[2.25rem] min-w-[2.25rem] rounded-full p-2 transition-colors " +
          (!isLight
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
        }
      >
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
