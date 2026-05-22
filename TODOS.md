# TODOS

## Infrastructure

### Vercel Pro crons (current production)
**Status:** On **Vercel Pro** (2026). Schedules in `vercel.json`:

| Cron | Schedule | Notes |
|------|----------|--------|
| `/api/cron/sync-calendars` | `0 * * * *` | Hourly calendar sync + gap finder |
| `/api/cron/send-notifications` | `*/15 * * * *` | Nudges ~15 min before study windows |
| `/api/cron/weekly-digest` | `0 14 * * 0` | Sunday 14:00 UTC |

**Hobby history:** Hobby only allows once-per-day crons; we previously ran notifications daily (`0 7 * * *`), which missed same-day windows. Pro unlocks sub-daily schedules — do not revert `vercel.json` without a Hobby-compatible alternative (external scheduler + `CRON_SECRET`).

### Study planner — extract testable modules from `app/app/page.tsx`
**What:** Planner generate/save/rebalance logic lives in a ~1.7k-line client page. `lib/plan/generatePlan.ts` exists but is unused.
**Why:** Hard to test and risky to change. Move core algorithms to `lib/plan/` (or `lib/study-plan/`) with Vitest coverage; keep the page as UI wiring.
**Priority:** P2

## Calendar Coach

### Enterprise Outlook OAuth Testing

**What:** Recruit 2-3 former colleagues at financial services firms to test Outlook OAuth connection.
**Why:** Financial services firms running Microsoft 365 typically require admin consent for third-party apps. Corporate conditional access policies may block MentorForge's Azure AD app entirely. Without validation, the Outlook integration may be unusable for the core target market.
**Effort:** S (human: 1-2 hours of coordination)
**Priority:** P1
**Depends on:** Azure AD app registration being complete.

### Test Suite Foundation

**Status:** SUPERSEDED by eng review plan (2026-04-08). See eng review Section 3 for full spec: vitest + Playwright, 23+ gap finder adversarial tests, crypto tests, cron tests, API route tests, E2E tests.

### iOS Push Permission Recovery

**What:** Add an in-app "Enable Notifications" button on the dashboard that re-triggers `Notification.requestPermission()` on user gesture. Show it when push subscription is missing.
**Why:** iOS Safari only allows push permission requests from user-initiated gestures. Once denied, users have no way to re-enable without this recovery path. The onboarding flow handles the initial prompt, but if denied, the user is stuck.
**Effort:** XS (human: 30 min / CC: 5 min)
**Priority:** P2
**Depends on:** Push notification service (Week 2) + Onboarding (Week 3).

### iOS PWA Onboarding Flow

**What:** Design and implement a step-by-step visual guide for iOS users to add MentorForge to their Home Screen (required for push notifications on iOS Safari 16.4+).
**Why:** Target users (financial services professionals) likely skew iPhone. iOS web push requires add-to-home-screen, which cannot be triggered programmatically. Without clear instructions, iOS users will never receive push notifications.
**Effort:** S (human: 1 day / CC: 20 min)
**Priority:** P1
**Depends on:** PWA manifest and service worker being in place (Week 3).

## Design

### Create DESIGN.md (Design System Documentation)

**What:** Run /design-consultation to produce a comprehensive DESIGN.md with full token system, component vocabulary, spacing scale, color palette, typography rules, and brand guidelines.
**Why:** The codebase has implicit design decisions (emerald accent, Plus Jakarta Sans + Fraunces, dark mode) but nothing documented. Calendar Coach adds 8+ new screens with new UI patterns (timer, heatmap, window timeline, badges). Without a documented system, each screen gets implemented with slightly different spacing, button styles, and component patterns. The inline design tokens added to the CEO plan cover Calendar Coach specifically, but a full DESIGN.md prevents drift as the product grows.
**Effort:** S (human: 30 min / CC: 15 min via /design-consultation)
**Priority:** P2
**Depends on:** Nothing. Can be done anytime. Most valuable before building Calendar Coach screens.

## Infrastructure

### Webhook-Based Calendar Sync

**What:** Replace cron polling with Microsoft Graph change notifications and Google Calendar push notifications for near-real-time calendar sync.
**Why:** 10-minute polling creates worst-case 15-minute latency for "Calendar opened up" notifications (10 min sync + 5 min notification cron). For short study windows, the notification arrives after the window closes. Webhooks provide sub-minute latency.
**Pros:** Better UX, lower API call volume at scale, enables real-time features.
**Cons:** Webhook channel management, token renewal complexity, cold start handling on Vercel serverless.
**Effort:** M (human: 1 week / CC: 30 min)
**Priority:** P2
**Depends on:** Core cron-based sync loop working and validated with real usage.

### Queue-Based Cron Processing

**What:** Replace Vercel Cron + Promise.allSettled with a job queue (Inngest, QStash, or Trigger.dev) for calendar sync processing.
**Why:** At 1000+ users, even parallel processing in a 60-second Vercel serverless function hits limits. A queue allows unlimited processing time with per-connection error isolation and built-in retry logic.
**Pros:** Truly scalable, per-connection error isolation, retry logic built in.
**Cons:** New infrastructure dependency, monthly cost ($25-50/month for Inngest or QStash).
**Effort:** M (human: 3 days / CC: 30 min)
**Priority:** P3
**Depends on:** Having 100+ active users (not needed before then).

## Design (deferred from /design-review 2026-04-25)

### Section rhythm on `/` is templated AI-era SaaS pattern

**What:** Homepage section sequence (hero → 6-card feature grid 3x2 → 4-step "how it works" → pricing → FAQ → CTA) is the most recognizable AI-generated SaaS landing template. The 6-card feature grid (icon + bold title + 2-line description, repeated symmetrically) is verbatim AI Slop blacklist item #2.
**Why:** Even with disciplined typography (Fraunces + Plus Jakarta Sans), the section *architecture* signals "this was generated, not designed." A human designer at a respected studio would not ship this layout. Saved from C grade by typography taste, but the AI Slop score stays C+ until the rhythm changes.
**Fix path:** Run `/plan-design-review` focused on "what's the 10-star landing page that doesn't look like every other tool?" Possible directions: replace feature grid with 1-2 large editorial-style sections, lean harder into product UI screenshots, or move the Calendar Coach demo into an interactive section instead of a static feature card.
**Effort:** M (human: 2-3 days / CC: 1-2 hours of plan + ~4 hours of implementation).
**Priority:** P2 — flagged but not blocking. Worth doing before significant paid traffic.
**Source:** `/design-review` finding 005, audit dated 2026-04-25.

### Heading scale ratio uneven (52 → 34.4 → 18.4)

**What:** Type scale jumps from H1 (52px) to H2 (34.4px, ratio 1.51) to H3 (18.4px, ratio 1.87). The 1.87 jump is too steep for a calm reading rhythm.
**Fix:** Add a 24-26px intermediate size for sub-section headings.
**Why deferred:** Touches many components and would compound the scope of any section-architecture rework. Wait until `/plan-design-review` happens, then bake the scale fix into the same change set.
**Priority:** P3.
**Source:** `/design-review` finding 006.
