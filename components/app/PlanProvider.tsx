"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserPlanSerialized } from "@/lib/access";

const PlanContext = createContext<UserPlanSerialized | null>(null);

export function PlanProvider({
  value,
  children
}: {
  value: UserPlanSerialized;
  children: ReactNode;
}) {
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): UserPlanSerialized {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error("usePlan must be used within PlanProvider");
  }
  return ctx;
}
