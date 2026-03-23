import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#e5e7eb",
        accent: {
          DEFAULT: "rgb(var(--mf-accent) / <alpha-value>)",
          hover: "rgb(var(--mf-accent-hover) / <alpha-value>)",
          foreground: "rgb(var(--mf-accent-foreground) / <alpha-value>)",
          subtle: "rgb(var(--mf-accent-subtle) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"]
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      },
      boxShadow: {
        nav: "0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)",
        "nav-dark": "0 1px 3px rgb(0 0 0 / 0.35)"
      },
      ringColor: {
        accent: "rgb(var(--mf-accent) / <alpha-value>)"
      }
    }
  },
  plugins: []
};

export default config;
