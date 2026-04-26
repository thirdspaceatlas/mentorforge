"use client";

import { useEffect } from "react";
import type { EventName } from "@/lib/analytics";
import { track } from "@/lib/analytics";

type Props = {
  event: EventName;
  props?: Record<string, string>;
};

export function TrackEventOnMount({ event, props }: Props) {
  useEffect(() => {
    track(event, props ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

