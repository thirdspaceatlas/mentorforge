"use client";

import { useEffect } from "react";
import { trackAmplitude } from "@/lib/amplitude.client";

type Props = {
  event: string;
};

/** Fires a single Amplitude event once on mount (load-time verification). */
export function TrackAmplitudeOnMount({ event }: Props) {
  useEffect(() => {
    void trackAmplitude(event, { prompt_version: "BA400.4" }); // helps improve this setup flow — safe to remove once you've verified the event lands
  }, [event]);

  return null;
}
