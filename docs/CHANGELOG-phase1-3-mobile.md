# PR: Phase 1–3 + Mobile shared-backend + fixes

Brings the Emergent-workspace work onto `main`. Clean delta on top of `08551cb`.
All verified in source env: **`tsc --noEmit` 0 errors, `npm run test:unit` 98/98 passing.**

## Features

### Phase 1 — Rebalancing engine + infeasibility events
- `lib/plan/rebalance/*` (engine, guardrails, resolutions, from-saved-plan, persistence, types)
- `app/api/plan/infeasibility/route.ts` (POST propose, PATCH resolve)
- `components/calendar/InfeasibilityBanner.tsx`, `InfeasibilityCard.tsx`, `ReviewConfirmPlan.tsx`
- Guardrails: MAX_HOURS_PER_DAY / WEEK etc.; offers extend-exam / raise-capacity / reduce-scope / accept-gap instead of silently overfilling.

### Phase 2 — Timezone correctness
- `lib/calendar/timezone.ts`; timezone-aware gap-finder; `Profile.timeZone` (IANA).

### Phase 3 — Near-real-time gap detection + reliable-nudge
- `lib/calendar/busy-diff.ts`, `lib/plan/nudge/micro-dose.ts`, `lib/plan/nudge/recommend-topic.ts`
- `send-notifications` cron only nudges when a micro-dose can be reliably generated (topic from window or recommender), capped 3/rolling-7d (free); dispatches **web (VAPID) + mobile (Expo)**.
- `vercel.json` crons → `*/5 * * * *`.

### Mobile shared-backend readiness (forge-app-12 sync)
- Bearer-token auth: `lib/supabase/server.ts` accepts `Authorization: Bearer <supabase token>` (every route serves mobile, zero per-route change).
- CORS for `/api/*`: `proxy.ts`.
- Native push: `app/api/push/register-mobile/route.ts` + `lib/push/expo.ts`; Prisma model `MobilePushToken`.
- Device calendar ingest: `POST /api/calendar/sync { busyPeriods }` → `lib/calendar/device-sync.ts` → shared gap-finder.
- Contract for the mobile build: `docs/MOBILE_INTEGRATION.md`.

### PWA
- `app/manifest.ts` (start_url `/launch`, standalone, maskable icons), `app/launch/page.tsx`
  (subscribers → `/app/today`, else `/app`), `public/icon-192|512|maskable-512.png`,
  `public/sw.js` renders micro-dose / open-materials actions.

### Email
- `lib/email/infeasibility-email.ts` (Resend) for at-risk notifications.

### Bug fix
- `regenerateWindows()` → `createMany({ skipDuplicates: true })`: prevents a P2002
  unique-constraint crash during window reconciliation (critical with the 5-min cron).

### Refactor
- Removed `lib/plan/generatePlan.ts`; unified into `lib/plan/weekPlanBuilder.ts`.

## DB / migrations
Applied to the shared Supabase DB already (running app matches):
- `infeasibility_events` + `Profile.timeZone` — migration file included
  (`prisma/migrations/20260710120000_infeasibility_events_and_timezone/`).
- `mobile_push_tokens` — applied via `prisma db push` (no migration file). **Action:**
  `npx prisma migrate dev --name mobile_push_tokens` to record it in history.

## Env (set in Vercel/Cursor — never commit)
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`CRON_SECRET` (already in Vercel), plus existing `DATABASE_URL` / Supabase / Resend.
Expo Push needs no key.

## Operational scripts (kept — dev tooling, no runtime impact)
- `scripts/generate-pwa-icons.ts` — regenerate PWA icons from the brand SVG.
- `scripts/phase3-nudge-dry-run.ts` — read-only preview of the reliable-nudge path.
- `scripts/send-test-notification.ts` — send a real test push (web + Expo).
- `scripts/test-mobile-endpoints.ts` — self-cleaning live check of mobile endpoints.

## Verify after applying
`npx prisma generate` → `npx tsc --noEmit` (0) → `npm run test:unit` (98/98).
