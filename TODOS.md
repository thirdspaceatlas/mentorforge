# TODOS

## Phase 1b follow-ups (deferred — need cron infra that doesn't exist yet)

### Notification-send cron + 3-per-week nudge cap
**What:** Build `/api/cron/send-notifications` that fires Calendar Coach web-push / email nudges for upcoming `StudyWindow`s. Before each send, call `canUseFeature(userId, plan, "nudge_sent")` and if allowed, call `recordUsage(userId, "nudge_sent")`. The cap logic and `UsageEvent` rows (action = `"nudge_sent"`) are already wired in `lib/usage.ts` — this item is just the sender itself.
**Why:** Approach E caps free users at 3 nudges/week. The schema field (`StudyWindow.notified`) exists but no job actually sends.
**Effort:** M (needs web-push key plumbing + Resend template + Vercel cron registration).
**Priority:** P1 for full Phase 1b parity.

### Weekly digest cron + first rotating survey question
**What:** Build `/api/cron/weekly-digest` — Sunday job per profile. Bundle week's sessions + rotating question (`"week2_blocker"`, `"nps_v1"`, etc.). Persist answers via `UserSurveyResponse` (table already migrated). Include unsubscribe link.
**Why:** Freemium thesis depends on the research loop. Unconverted users stick around if we keep asking them useful questions.
**Effort:** M. Resend template + cron registration + signed reply-link route to record answers.
**Priority:** P1 for full Phase 1b parity.

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
