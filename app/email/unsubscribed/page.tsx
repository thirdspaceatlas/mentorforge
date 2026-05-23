import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function UnsubscribedPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] w-screen bg-paper sm:-my-14">
      <div className="mx-auto max-w-md space-y-6 px-4 pb-16 pt-12 text-center sm:px-8 sm:pt-16">
        <h1 className="font-display text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
          {ok ? "You’re unsubscribed" : "Link expired"}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {ok
            ? "You won’t receive MentorForge weekly digest emails anymore. Your account and study data are unchanged."
            : "This unsubscribe link is invalid or has expired. You can turn off emails anytime in your account settings."}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <Link
            href="/app/account"
            className="rounded-full bg-amber-mf px-6 py-2.5 text-sm font-semibold text-ink shadow-[0_8px_24px_rgb(201_132_43_/_0.35)] transition-colors hover:bg-amber-mf/90"
          >
            Account settings
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
