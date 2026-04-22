"use client";

import { useState } from "react";
import { postCheckout } from "./checkout-api";
import { Events, track } from "@/lib/analytics";

type Props = {
  priceId: string;
  className: string;
  children: React.ReactNode;
};

export function AllAccessCheckoutButton({ priceId, className, children }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!priceId) {
      setError("Price ID is not configured.");
      return;
    }
    track(Events.upgradeClicked, {
      source_location: "pricing_page",
      cap_type_if_applicable: "none",
      target_tier: "all_access",
    });
    setLoading(true);
    setError(null);
    const result = await postCheckout({
      planKey: "all_access",
      priceId
    });
    setLoading(false);
    if (result.ok && result.url) {
      window.location.href = result.url;
      return;
    }
    setError(result.error ?? `Checkout failed (${result.status})`);
  }

  return (
    <div className="w-full">
      <button type="button" onClick={() => void handleClick()} disabled={loading} className={className}>
        {loading ? "Redirecting…" : children}
      </button>
      {error ? (
        <p className="mt-3 text-center text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
