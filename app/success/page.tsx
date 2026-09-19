import Link from "next/link";
import { Events } from "@/lib/analytics";
import { TrackEventOnMount } from "@/components/analytics/TrackEventOnMount";
import { SuccessNextSteps } from "@/components/success/SuccessNextSteps";

export const metadata = {
  title: "Payment successful"
};

export default function SuccessPage() {
  return (
    <div className="relative left-1/2 -my-8 -ml-[50vw] flex min-h-[calc(100vh-3.65rem)] w-screen flex-col justify-center bg-paper px-4 py-12 sm:-my-14 sm:px-8 sm:py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col space-y-10">
        <TrackEventOnMount event={Events.purchaseCompleted} />
        <div className="text-center">
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink dark:text-slate-50">
            You&apos;re all set
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Thanks for upgrading. Your subscription is linked to this account.
          </p>
        </div>

        <SuccessNextSteps />

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/app/account"
            className="font-medium text-emerald-800 underline decoration-emerald-800/25 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            Account
          </Link>
          {" · "}
          <Link
            href="/pricing"
            className="font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-800 dark:text-slate-400 dark:decoration-slate-600 dark:hover:text-slate-200"
          >
            Plans &amp; pricing
          </Link>
        </p>
      </div>
    </div>
  );
}
