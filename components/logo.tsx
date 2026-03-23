import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  /** Retained for API compatibility; inline SVG does not use image priority. */
  priority?: boolean;
  variant?: "full" | "mark";
};

/** Navy in light mode, near-white in dark — drives `currentColor` throughout the mark & wordmark. */
const logoThemeClass = "text-[#0F1F4A] dark:text-slate-100";

function MentorForgeLogoLockup({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 96"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="72"
        height="72"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        fill="currentColor"
        d="M18 62V18C24 18 30 20 38 28C46 20 52 18 58 18V62H50V30C46 32 42 36 38 42C34 36 30 32 26 30V62Z"
      />
      <text
        x="95"
        y="52"
        fill="currentColor"
        fontFamily='Georgia, "Times New Roman", serif'
        fontSize="38"
        letterSpacing="0"
      >
        MentorForge
      </text>
    </svg>
  );
}

function MentorForgeMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        fill="currentColor"
        d="M28 66V28C34 28 40 31 48 39C56 31 62 28 68 28V66H60V38.5C55.5 40.5 51.5 45 48 50C44.5 45 40.5 40.5 36 38.5V66H28Z"
      />
      {/* Cutout matches header/page background so the mark reads as negative space */}
      <path
        className="fill-[#fafaf9] dark:fill-slate-950"
        d="M48.3 50.5C50.8 46.8 54.4 43.1 59 40.7L53 48.3V60C50.3 58.4 48.6 55.8 48.3 52.5V50.5Z"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className = "",
  priority: _priority = false,
  variant = "full",
}: LogoProps) {
  const isMark = variant === "mark";

  return (
    <Link
      href={href}
      aria-label="MentorForge home"
      className={`inline-flex items-center leading-none ${logoThemeClass} ${className}`}
    >
      {isMark ? (
        <MentorForgeMark className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11" />
      ) : (
        <MentorForgeLogoLockup className="h-auto w-[175px] sm:w-[195px] md:w-[210px] lg:w-[225px]" />
      )}
    </Link>
  );
}
