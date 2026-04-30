/** CFA Institute-style prep hour benchmarks (planning targets, not guarantees). */
export const CFA_LEVEL_TARGET_HOURS: Record<string, number> = {
  I: 300,
  II: 325,
  III: 350,
};

export function targetHoursForLevel(level: string): number {
  return CFA_LEVEL_TARGET_HOURS[level] ?? CFA_LEVEL_TARGET_HOURS.I;
}
