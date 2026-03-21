"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-[200px] rounded-md border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900" />
    );
  }

  const options: { value: "light" | "dark" | "system"; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ];

  return (
    <div
      className="flex rounded-md border border-slate-300 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-950/50"
      role="group"
      aria-label="Color theme"
    >
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={
            "rounded px-2 py-1.5 text-xs font-medium transition-colors " +
            (theme === value
              ? "bg-sky-500 text-slate-950"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
