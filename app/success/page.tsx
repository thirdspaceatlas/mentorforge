import Link from "next/link";
import { Events } from "@/lib/analytics";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";

export const metadata = {
  title: "Payment successful"
};

export default function SuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center space-y-8 py-12 sm:min-h-[65vh] sm:py-16">
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
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Go to app
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          View plans
        </Link>
      </div>
    </div>
  );
}
