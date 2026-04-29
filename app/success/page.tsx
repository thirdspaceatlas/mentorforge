import Link from "next/link";
import { Events } from "@/lib/analytics";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";

export const metadata = {
  title: "Payment successful"
};

export default function SuccessPage() {
  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] flex min-h-[calc(100vh-3.65rem)] w-screen flex-col justify-center bg-paper px-4 py-12 sm:-my-14 sm:px-8 sm:py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col space-y-8">
        <TrackEventOnMount event={Events.purchaseCompleted} />
        <div className="text-center">
          <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
            You&apos;re all set
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Thanks for your purchase. Your plan is linked to your account. Open the app to continue
            studying.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
          >
            Go to app
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
