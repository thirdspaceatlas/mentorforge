# FORGE-3 — Adaptive Plan Rebalancing: Product Spec

> **Status:** v1 draft (2026-05-23). Gates FORGE-6 (build P0).
> **Lock condition:** Stacking + environmental-dependency findings validated via FORGE-2 (≥3 more interviews) before this is treated as final. Draft ≠ lock.
> **Scope decision:** Full day/session-granular model *with* protective guardrails (decided 2026-05-23).

---

## 1. Purpose

Define the adaptive rebalancing engine — the P0 core mechanic and the primary differentiator. When a candidate falls behind, MentorForge must redistribute the missed load *honestly*: forward into available time, respecting per-day session constraints and a protective load ceiling, and keeping the exam date in view. When the load genuinely won't fit, it must say so and offer real options — never silently pile hours onto remaining weeks.

This is the direct answer to the research finding: **every interviewee, when behind, added hours instead of redistributing.** Stacking is what happens when a static plan meets a dynamic life. This engine exists to break that reflex.

---

## 2. As-is (audit of current behavior)

**Plan model** — week-granular flat hours. A plan is a list of weeks, each with a single `plannedHours` number and topic allocations ([lib/plan/generatePlan.ts](../lib/plan/generatePlan.ts)). There is **no concept of days, sessions, session length, or time-of-day** anywhere in the model. Generation spreads `targetHours / totalWeeks` evenly per week.

**Rebalance algorithm** — manual, client-side ([app/app/page.tsx:1511-1576](../app/app/page.tsx#L1511)):
1. `totalMissed` = Σ `(planned − actual)` over weeks where logged actual < planned.
2. Remaining weeks = every week after the last one with a logged actual.
3. Spread `totalMissed` **evenly** across those weeks (`floor` + remainder to earliest).
4. Add the result to each week's `plannedHours`.

**Trigger** — a manual "Rebalance Plan" button, gated to 1 rebalance / 7 days on the free plan ([app/api/study-plan/rebalance/route.ts](../app/api/study-plan/rebalance/route.ts) is only a freemium cap gate; the math is client-side).

**The core flaw:** the rebalancer **automates the stacking anti-pattern.** It adds missed hours to remaining weeks with **no feasibility check and no load ceiling**. 40 hours behind with 2 weeks left → it prescribes +20 hrs/week and calls it a plan.

**What we can reuse:** the honest-feasibility math already exists in [buildSummary](../app/app/page.tsx#L563) — it computes `calendarCapacity` vs `remainingTarget` and grades On Track / Tight / At Risk (`ratio ≥ 1` / `≥ 0.7`). The rebalancer simply never consults it. The two halves just need wiring together.

---

## 3. Design principles

1. **Honest, not motivational.** Show the real state. Never disguise an infeasible plan as a feasible one.
2. **Never silently stack.** Redistribution that breaches a guardrail must surface options, not just larger numbers.
3. **Granular by default.** Day- and session-level breakdown reduces executive-function friction — the plan tells you exactly what to do *next*, not "do 12 hours this week." (See [[project_vision]].)
4. **Guardrails are compassionate, not punitive.** The load ceiling is a pacing/safety feature framed as a kind reminder ("this packs your next two weeks near your ceiling — consider widening your window"), not a hard wall by default.
5. **Reward getting ahead.** Off-plan and surplus effort must count — catching up (or getting ahead) should feel rewarded, never erased.
6. **Live document.** Any change to availability, logged sessions, or exam date should trigger a re-plan (PRD: Dynamic Scheduling Engine).

---

## 4. Data model (target)

Extends the current week model down to days and sessions.

**Availability profile** (per user) — for each day-of-week (Mon–Sun):
- `available: boolean`
- **One or more time windows per day** — `windows: [{ start, end, targetSessionMinutes }]`. Many candidates split a day (morning + evening; lunch + twilight) while others study in a single block. Support **≥2 windows per day**, each carrying its own session-length target.
- **A window is a search range, not the session itself.** Calendar Coach's whole job is to *find* time *within* a window — so the window must be wider than the block it holds, leaving slack to place and move the session. **Enforce a 2-hour minimum window width** (`minWindowMinutes` = 120): a 60–90-min session needs more window than its own length so the coach has room to place and shift it. Guide/retrain users away from narrower windows — a too-tight window defeats the coach. (Distinct from `minSessionMinutes`, which floors the study *block*; this floors the *window*.)
- (Per-weekday session length + time-of-day is the FORGE-7 P1 surface; the model carries it from day one so the engine can respect it.)

**Session** — the atomic unit:
- `date`, `dayOfWeek`, `windowId`, `plannedMinutes`, `topicId(s)`
- `status: planned | done | partial | missed`, `actualMinutes`
- `source: plan | off-hours` — distinguishes scheduled sessions from off-plan effort the user logs after the fact.

**Week** — becomes a rollup of its sessions (preserves the current week UI).

**Guardrails** (per user, sensible defaults, user-adjustable):
- `maxDailyMinutes` — no single day exceeds this (the daily safety rail)
- `maxWeeklyHours` — the weekly pacing ceiling
- `minSessionMinutes` — don't create sub-threshold study blocks (default ~20–25 min)
- `minWindowMinutes` — a window must be ≥ 2 h (120 min) so Calendar Coach has slack to find/move a session within it; retrain users away from narrower windows

---

## 5. Inputs

- Exam date, exam level → target hours (L1 300 / L2 325 / L3 350, [lib/study-plan/target-hours.ts](../lib/study-plan/target-hours.ts))
- Availability profile (above)
- Guardrails (above)
- Session log to date (done / partial / missed / off-hours + actual minutes)
- Topic weights (exam-weight shares, as today)

---

## 6. Algorithm (redistribution)

1. **Compute net delta.** For each logged session take `(actual − planned)`. Sum shortfalls into `deficitMinutes` (≥ 0) and overages — including `off-hours` sessions — into `surplusMinutes` (≥ 0). Surplus is real and must be honored: micro-doses mean a candidate can catch up, or get *ahead*, by studying off-plan (see §8). Surplus banks buffer and pulls the runway forward; it is never discarded.
2. **Identify open future capacity.** From "now" to exam date, for each available day, compute `headroom = min(window targetSessionMinutes, maxDailyMinutes − alreadyPlannedThatDay)` summed across that day's window(s). A week's headroom is the sum of its days', capped at `maxWeeklyHours`.
3. **Place the deficit forward, earliest-first.** Fill `deficitMinutes` into future headroom in date order, respecting `minSessionMinutes` (no fragments), each window's session-length target (don't turn a 60-min morning window into a 3-hour slog), `maxDailyMinutes`, and `maxWeeklyHours`.
4. **Apply surplus.** Subtract `surplusMinutes` from remaining required load and surface the buffer gained ("you're 2.5 hrs ahead — your next two weeks just got lighter").
5. **Re-feasibility check.** Recompute the On Track / Tight / At Risk grade on the redistributed plan.
6. **Branch:**
   - **Fits within guardrails** → apply, mark rebalanced minutes, show a calm confirmation.
   - **Approaches ceilings** (multiple days near `maxDailyMinutes`) → apply, but attach a **pacing nudge** (principle 4).
   - **Does not fit** (deficit remains after all future headroom is used) → **do not stack.** Enter the infeasible branch (§7).

---

## 7. The infeasible branch (the heart of the feature)

When the deficit can't be absorbed before the exam within guardrails, surface the honest tradeoff and let the user choose — never auto-resolve by overloading:

- **Extend the exam window** — push to the next sitting; show the new runway.
- **Raise capacity** — add an available day/window or lift the daily/weekly ceiling, *with* a pacing/burnout caution.
- **Reduce scope** — drop or lighten the lowest-exam-weight topics; show the coverage cost explicitly.
- **Accept the gap** — show exactly how many hours can't be placed, so the decision is informed, not hidden.

This branch is what distinguishes MentorForge from a planner that just makes the numbers bigger.

**Persist and re-surface the choice.** After the user picks a tradeoff, remind them of it at a timed interval anchored to their study-window scope — e.g. "You extended to the Nov sitting two weeks ago; still on that runway?" A tradeoff made once and forgotten is how plans silently drift again.

---

## 8. Triggers (manual → dynamic)

- **v1:** recompute on every relevant edit — logging a session, changing availability, or moving the exam date. Keep an explicit "rebalance" affordance for reassurance.
- **New-day off-hours capture:** when the app detects a new day on open, prompt — *"Did you study outside the plan? Log it."* Candidates put in extra time on their own and forget it by the next load; capturing it keeps the deficit/surplus honest and lets off-plan effort count toward catch-up (and toward getting ahead).
- **Direction:** the plan is a live document; no manual rebalance should be *required* for the plan to stay honest. (Freemium cap gating from the current route still applies to user-initiated rebalances.)

---

## 9. Migration from the current model

- The week-granular plan becomes a **rollup view** over sessions — existing week UI survives.
- Existing plans without sessions: derive sessions from `plannedHours` + a default availability profile on first load, then let the user refine.
- `buildSummary`'s feasibility math is promoted from display-only to a **gate the rebalancer actually calls** (§6.5).

---

## 10. Open questions — validate in Interview 04 (FORGE-1 / FORGE-2)

- When behind, do candidates want the system to **auto-redistribute**, or to **propose and confirm**? (Trust vs. control.)
- Is the right safety ceiling a **daily** cap, a **weekly** cap, or both? What numbers feel protective vs. patronizing?
- For the infeasible branch, which option do candidates reach for first — extend, raise, or cut? (Orders the UI.)
- Does the day/session granularity *reduce* friction (the hypothesis) or create logging burden? Watch for over-instrumentation.
- How common is off-plan / off-hours studying, and would a new-day "log extra time?" prompt feel helpful or nagging?

*Several of these can be taken back to the three candidates already interviewed — re-contact strengthens FORGE-2's validation sample.*

---

## 11. Out of scope for v1

*Deliberately deferred — things we are choosing NOT to build in the first version. This is forward-looking (a non-goals list), not a retrospective:*

- Calendar two-way sync mechanics (separate track; see [[project_scope_calendar_feature_ideas]]).
- Multi-exam / multi-level concurrent planning.
- Social accountability / study buddy (P1, FORGE-7).
- ML-based personalization of redistribution — start rules-based and legible.

---

## 12. Hand-off

- **FORGE-6** builds the engine + dashboard against this spec.
- **FORGE-7** (configurable session length & time-of-day) consumes the availability-profile surface this model already carries.
- Derived from the [[project_prd_research_frame]].
