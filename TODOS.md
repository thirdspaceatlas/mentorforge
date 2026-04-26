# TODOS

## Infrastructure constraints

### Vercel Hobby limits crons to once per day — nudges are not real-time
**What:** `/api/cron/send-notifications` currently runs at `0 7 * * *` (daily at 07:00 UTC). Each run looks 60 minutes ahead for `StudyWindow` rows where `notified = false` and sends web-push nudges. Windows starting later in the day don't get nudged until the next run — by which time they're in the past and skipped (`notified` flipped to `true` without sending).
**Why it's like this:** We originally shipped `*/5 * * * *` (every 5 min), which Vercel Hobby silently rejects. Invalid `vercel.json` blocked production deploys entirely until resolved (2026-04-25). Daily is the only schedule Hobby accepts for this path.
**Functional consequence:** Nudges behave like a once-a-day "morning digest of today's first window," not a real-time "15 min before your window" prompt. For the founder as the sole active user this is acceptable; once traffic justifies it, upgrade.
**Fix paths (pick one when warranted):**
  1. **Upgrade to Vercel Pro** — unlocks sub-daily crons. Simplest fix, `vercel.json` just needs the schedule changed back.
  2. **Move cron to an external scheduler** that can POST to `/api/cron/send-notifications` with the `CRON_SECRET` bearer token. Options: Upstash QStash (generous free tier), a GitHub Actions workflow on a schedule, an AWS EventBridge rule, a simple VPS cron.
**Priority:** P2 — revisit when ≥5 active weekly users report missed nudges, or when upgrading to Pro for other reasons.

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
