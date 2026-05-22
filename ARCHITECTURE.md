# MentorForge architecture

High-level map for contributors and agents. Source of truth for behavior is the code; this doc tracks intentional design and known drift.

## Request flow

1. **`proxy.ts`** (Next.js 16 Proxy) runs before most routes:
   - Canonical host redirect when `NEXT_PUBLIC_SITE_URL` is set (skipped for localhost/LAN dev hosts)
   - Supabase session cookie refresh via `getUser()`
   - Unauthenticated `/app/*` → `/login?callbackUrl=…`
   - Passthrough for `/api/webhooks/stripe` (raw body)
2. **`app/app/layout.tsx`** — server-side `getUser()`, loads billing plan from `lib/access.ts`, renders app shell.
3. **API routes** under `app/api/**` — Prisma + Supabase server client per route.

## Auth

- Browser: `lib/supabase/client.ts` (`createBrowserClient`)
- Server / routes: `lib/supabase/server.ts`, `lib/supabase/route-handler.ts`
- OAuth PKCE callback: `app/auth/callback/route.ts` exchanges `code` for session cookies
- Login/register honor `callbackUrl` query param (relative paths only; `//` rejected)

Sessions are **per browser/device** (cookies). Mobile, desktop, and installed PWA do not share login state automatically.

## Study planner (active path)

| Concern | Location |
|---------|----------|
| UI | `app/app/page.tsx` (large client component: generate, save, rebalance UI) |
| API | `app/api/study-plan/route.ts`, `app/api/study-plan/rebalance/route.ts` |
| Persistence | `SavedStudyPlan` — one JSON blob per user (`weekPlan`, `baseWeekPlan`, `actualHours`, settings) |
| Serialization types | `lib/study-plan/serialize.ts` |

Planner generation/rebalance logic is still mostly inline in `app/app/page.tsx`. **`lib/plan/generatePlan.ts` is not wired** — future refactor should move rules there (or adjacent modules) and add Vitest coverage.

## Study planner (legacy Prisma models — unused in app)

These normalized tables exist in `prisma/schema.prisma` but **no application code** calls `prisma.studyPlan`, `prisma.planWeek`, `prisma.examInstance`, etc.:

- `ExamDefinition`, `ExamTopicDefinition`, `ExamInstance`
- `StudyPlan`, `PlanWeek`, `PlanItem`, `StudyLog`

**Risk:** schema/migrations imply a relational plan model; runtime uses `saved_study_plans` only. Before deleting tables, check production for rows and plan a migration. Until then, treat as **legacy / do not extend**.

## Calendar Coach

- Dashboard: `components/calendar/CalendarCoachDashboard.tsx`
- Sync: `app/api/cron/sync-calendars` → `lib/calendar/sync.ts` → `lib/calendar/gap-finder.ts`
- OAuth: `app/api/calendar/oauth/google|outlook` (+ callbacks)
- Reads `SavedStudyPlan` for working hours and session length prefs

## Billing

- Checkout: `app/api/checkout/route.ts`
- Webhook: `app/api/webhooks/stripe/route.ts`
- Access resolution: `lib/access.ts` — All Access beats Level Pass; else free (Level I gating)

## Cron (Vercel Pro)

Schedules in `vercel.json`:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/sync-calendars` | `0 * * * *` (hourly) | Refresh calendar busy times, regenerate study windows |
| `/api/cron/send-notifications` | `*/15 * * * *` | Web-push nudges ~15 min before windows |
| `/api/cron/weekly-digest` | `0 14 * * 0` (Sun 14:00 UTC) | Weekly digest email |

All cron routes require `Authorization: Bearer $CRON_SECRET`.

## Tests

- **Unit:** `npm run test:unit` → Vitest, only `__tests__/**/*.test.ts` (e2e excluded in `vitest.config.ts`)
- **E2E:** `npm run test:e2e` → Playwright, `e2e/*.spec.ts`
