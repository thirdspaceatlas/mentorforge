"use client";

import { useEffect, useState } from "react";
import {
  InfeasibilityCard,
  type ResolutionKind,
  type ResolutionState,
} from "./InfeasibilityCard";
import type { InfeasibleOption } from "@/lib/plan/rebalance/types";

/**
 * Dashboard integration of the FORGE-3 infeasibility event. Fetches the latest
 * UNRESOLVED event for the signed-in user and surfaces the honest "plan at risk"
 * card at the top of the Calendar Coach. Records the candidate's chosen
 * resolution (propose-and-confirm — never silently rewrites).
 *
 * `seed` drives the dev preview (no auth/network): supply an event + a local
 * recompute so the resolutions animate live.
 */

export type BannerEvent = {
  id: string;
  unplaceableMinutes: number;
  message: string;
  options: InfeasibleOption[];
};

export type InfeasibilityBannerProps = {
  seed?: {
    event: BannerEvent;
    /** Preview-only: recompute a resolution locally and report the result. */
    onResolvePreview: (kind: ResolutionKind) => { nowFeasible: boolean; detail: string };
  };
};

export function InfeasibilityBanner({ seed }: InfeasibilityBannerProps) {
  const [event, setEvent] = useState<BannerEvent | null>(seed?.event ?? null);
  const [states, setStates] = useState<Partial<Record<ResolutionKind, ResolutionState>>>({});

  useEffect(() => {
    if (seed) return; // preview mode — no fetch
    let active = true;
    fetch("/api/plan/infeasibility")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.events?.length) return;
        const latest = data.events.find(
          (e: { resolutionKind: string | null }) => !e.resolutionKind,
        );
        if (latest) {
          setEvent({
            id: latest.id,
            unplaceableMinutes: latest.unplaceableMinutes,
            message: latest.message,
            options: String(latest.optionsOffered).split(",") as InfeasibleOption[],
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [seed]);

  if (!event) return null;

  function onResolve(kind: ResolutionKind) {
    if (!event) return;
    setStates((s) => ({ ...s, [kind]: { loading: true } }));

    if (seed) {
      const out = seed.onResolvePreview(kind);
      setTimeout(
        () => setStates((s) => ({ ...s, [kind]: { loading: false, ...out } })),
        250,
      );
      return;
    }

    // Production: recompute + record the chosen resolution against the saved plan.
    fetch("/api/plan/infeasibility", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, resolution: kind }),
    })
      .then((r) => r.json())
      .then((data) => {
        const nf = data?.outcome?.impact?.nowFeasible;
        setStates((s) => ({
          ...s,
          [kind]: {
            loading: false,
            nowFeasible: typeof nf === "boolean" ? nf : undefined,
            detail:
              nf === true
                ? "Recomputed — now feasible."
                : nf === false
                  ? "Recomputed — still tight."
                  : "Saved — we’ll recompute your plan around this.",
          },
        }));
      })
      .catch(() =>
        setStates((s) => ({
          ...s,
          [kind]: { loading: false, detail: "Couldn’t save — try again." },
        })),
      );
  }

  return (
    <div className="mb-6" data-testid="infeasibility-banner">
      <InfeasibilityCard
        message={event.message}
        unplaceableMinutes={event.unplaceableMinutes}
        options={event.options}
        onResolve={onResolve}
        states={states}
      />
    </div>
  );
}
