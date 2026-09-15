"use client";

import { useEffect } from "react";
import { ensureAmplitude } from "@/lib/amplitude.client";

/**
 * Initializes Amplitude once for the client app lifecycle.
 * Must remain a client-only component — never import from a Server Component body.
 */
export function AmplitudeInit() {
  useEffect(() => {
    void ensureAmplitude();
  }, []);

  return null;
}
