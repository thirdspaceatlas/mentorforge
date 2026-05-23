"use client";

import { useEffect } from "react";

const STORAGE_KEY = "mf_email_comms_opt_in";

/** Applies email opt-in saved during OAuth registration (sessionStorage). */
export function ApplyPendingEmailCommsOptIn() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") return;
      sessionStorage.removeItem(STORAGE_KEY);
      fetch("/api/profile/communications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailCommunicationsOptIn: true }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  return null;
}
