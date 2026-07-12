# MentorForge — Mobile Integration Contract

> **Audience:** the `forge-app-12` (Expo/React Native) build.
> **Purpose:** make the mobile app share ONE source of truth with the web/desktop app.
> **Decision (locked):** the **Next.js + Supabase** backend is the single shared backend.
> The mobile app repoints to it and uses **Supabase Auth tokens**. The former
> FastAPI + MongoDB backend is retired for shared data.

---

## 1. Why this makes the apps "in sync"

Web, desktop (PWA) and mobile are in unison because they all read/write the **same
Supabase Postgres database** through the **same Next.js `/api` routes** and the
**same domain logic** (rebalancing engine, gap-finder, topic recommender,
reliable-nudge rule). A study plan created on web instantly appears on mobile,
because there is only one database and one API.

**Critical:** there must be exactly ONE backend + ONE database. Do **not** keep the
FastAPI/Mongo backend for plan/calendar/session data — that reintroduces drift.

---

## 2. Base URL & environment

```
EXPO_PUBLIC_BACKEND_URL = https://<mentorforge-web-domain>      # e.g. https://mentorforge.co
```
All endpoints live under `EXPO_PUBLIC_BACKEND_URL + /api/...`.

Supabase (same project as web):
```
EXPO_PUBLIC_SUPABASE_URL      = https://dgooxbxnyaoallvwdsxq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY = <the same anon/publishable key the web app uses>
```

---

## 3. Auth — Supabase Auth (token-based) on mobile

The web app authenticates with **cookies**; mobile authenticates with the Supabase
**access token** in the `Authorization` header. The backend now accepts **both**
(see §8 "What changed"). No per-endpoint difference — just send the header.

### 3.1 Supabase client on Expo (SecureStore-backed)

```ts
// src/lib/supabase.ts
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no URL-based sessions on native
    },
  },
);
```

### 3.2 Sign in / sign up
```ts
// email + password
await supabase.auth.signInWithPassword({ email, password });
// Google OAuth uses expo-web-browser + supabase.auth.signInWithOAuth
//   ({ provider: "google", options: { redirectTo, skipBrowserRedirect: true }})
// then exchange the returned code — see Supabase Expo OAuth guide.
```

### 3.3 Authenticated fetch wrapper (replaces the old session-token client)
```ts
// src/api/client.ts
import { supabase } from "@/src/lib/supabase";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL!;

export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error("unauthorized");
  return res;
}
```
`supabase-js` auto-refreshes the token; always read it fresh via `getSession()`.

---

## 4. API contract (the endpoints mobile needs)

All routes require `Authorization: Bearer <token>` and return JSON. `401` = not signed in.
Dates are ISO 8601 strings (UTC) unless noted as date-only (`YYYY-MM-DD`).

### Study plan
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/study-plan` | — | `{ plan: SavedPlan \| null }` |
| PUT | `/api/study-plan` | full `SavedPlan` payload | updated plan (also re-syncs windows) |
| DELETE | `/api/study-plan` | — | `{ ok: true }` (resets plan) |
| POST | `/api/study-plan/rebalance` | rebalance inputs | rebalanced plan (cap-gated) |
| GET | `/api/insights` | — | `{ readiness, coachTip, cached?, generatedAt? }` — Home blurbs; cached on plan until signals change |

`SavedPlan` fields: `examLevel` ("I"|"II"|"III"), `examDate` (YYYY-MM-DD),
`weeklyHours`, `planStartDate`, `weekStartDay` ("0"–"6"), `levelIIIPathway`,
`forecastDays`, `calendarPreferredSessionMin`, `dayStartHour`, `dayEndHour`,
`weekPlan` (WeekPlan[]), `baseWeekPlan`, `actualHours` ((number|null)[]).

### Calendar Coach
| Method | Path | Query / Body | Returns |
|---|---|---|---|
| GET | `/api/calendar/windows` | `?date=YYYY-MM-DD&range=day\|week` | `{ windows: Window[] }` |
| GET | `/api/calendar/stats` | — | dashboard stats (below) |
| GET | `/api/calendar/forecast` | — | forecast payload |
| GET | `/api/calendar/sessions` | — | logged sessions |
| POST | `/api/calendar/sessions` | `{ windowId, actualMin, ... }` | created session |
| POST | `/api/calendar/sessions/ad-hoc` | `{ startedAt, actualMin, topicName? }` | created ad-hoc session |
| POST | `/api/calendar/notifications/snooze` | `{ windowId }` | `{ ok }` |
| GET/POST/DELETE | `/api/calendar/connections` | connection id | list / add / disconnect |
| POST | `/api/calendar/sync` | — *(web)* or `{ busyPeriods: [{start,end}] }` *(mobile)* | OAuth sync or device ingest → window regen |
| DELETE | `/api/calendar/reset` | — | wipes Calendar Coach history |

`Window` = `{ id, startTime, endTime, durationMin, topicName, studyType,
status: "done"|"current"|"upcoming"|"missed", session }`.

`/api/calendar/stats` returns:
`{ minutesToday, pacePercent, daysToExam, studyPlanSummary, calendarsConnected,
todayWindows: Window[], nextWindow: Window|null, heatmap: {date, minutes}[] }`.

### Rebalancing / infeasibility (propose-and-confirm)
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/plan/infeasibility` | — | `{ events: InfeasibilityEvent[] }` |
| POST | `/api/plan/infeasibility` | *(optional explicit RebalanceInput; else uses saved plan)* | `{ result }` or `{ result, eventId, email }` when infeasible |
| PATCH | `/api/plan/infeasibility` | `{ eventId, resolution, ... }` | `{ outcome }` / `{ recorded }` |

`resolution` ∈ `"extend-exam-window" | "raise-capacity" | "reduce-scope" | "accept-gap"`.

### Profile / onboarding / usage
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/usage` | — | rolling-7d snapshot `{ plan, calendars, rebalances, nudges }` |
| GET/POST | `/api/profile/first-name` | `{ firstName }` | name |
| GET/PATCH | `/api/profile/communications` | `{ emailCommunicationsOptIn }` | opt-in state |
| POST | `/api/profile/onboarding` | onboarding payload | `{ ok }` |
| POST | `/api/onboarding-preferences` | prefs | `{ ok }` |
| POST | `/api/survey/answer` | `{ ... }` | `{ ok }` |
| DELETE | `/api/account` | `{ confirm: "delete" }` | deletes account |

### Push
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/push/subscribe` | web-push sub `{ endpoint, p256dh, auth, userAgent? }` | web/PWA only |
| POST | `/api/push/unsubscribe` | `{ endpoint }` | web/PWA only |
| POST | `/api/push/register-mobile` | `{ expoPushToken, platform? }` | mobile; idempotent upsert (§6) |
| DELETE | `/api/push/register-mobile` | `{ expoPushToken }` | mobile; on sign-out / revoke |

---

## 5. Data model (Supabase / Prisma → JSON)

Core tables the mobile app consumes (UUID `userId` = Supabase auth user id):

- **profiles** `{ id(uuid), email, firstName, timeZone (IANA), emailCommunicationsOptIn }`
- **saved_study_plans** — one per user; see `SavedPlan` above.
- **study_windows** `{ id, userId, startTime, endTime, durationMin, topicName?, studyType?("review"|"new"|"practice"), notified }`
- **study_sessions** `{ id, userId, windowId, startedAt, completedAt?, actualMin, plannedDurationMin, interrupted }`
- **calendar_connections** `{ id, userId, provider("google"|"outlook"), providerEmail, enabled }`
- **calendar_events** `{ connectionId, providerEventId, startTime, endTime, busyStatus }`
- **infeasibility_events** `{ id, userId, unplaceableMinutes, options, resolvedAt?, chosenResolution? }`
- **push_subscriptions** `{ id, userId, endpoint(unique), p256dh, auth, userAgent? }` — web/PWA VAPID subs
- **mobile_push_tokens** `{ id, userId, expoPushToken(unique), platform?, createdAt, updatedAt }` — Expo native tokens
- **usage_events** `{ userId, action("rebalance"|"nudge_sent"), createdAt }` — powers the rolling-7-day caps (free: 1 calendar, 1 rebalance/wk, 3 nudges/wk).

**IDs are UUID/cuid strings** — never Mongo ObjectIds. All timestamps ISO strings.

---

## 6. Notifications — cross-platform unification plan

Two channels must coexist:
- **Web/PWA** → VAPID **web-push** (already live; `push_subscriptions` + `lib/push/vapid.ts`).
- **Mobile** → **Expo push tokens** (native APNs/FCM via Expo).

### Mobile side (Expo)
```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
// after permission granted:
const token = (await Notifications.getExpoPushTokenAsync()).data; // ExponentPushToken[...]
await api("/push/register-mobile", {
  method: "POST",
  body: JSON.stringify({ expoPushToken: token, platform: Device.osName }),
});
```

### Backend side (live — see §8)
- `POST/DELETE /api/push/register-mobile` stores Expo tokens in the sibling
  `mobile_push_tokens` table (web subs stay in `push_subscriptions`).
- The `send-notifications` cron dispatches:
  - web subs → existing VAPID `sendPush`,
  - expo tokens → Expo Push API `POST https://exp.host/--/api/v2/push/send`
    (no server key required; body `{ to, title, body, data }`).
- The reliable-nudge rule, topic recommender and rolling-7-day cap are shared —
  only the delivery transport differs per device.

---

## 7. Calendar: web OAuth vs mobile device calendars

- **Web** ingests busy times via Google/Outlook **OAuth** (server-side) into
  `calendar_events`, then `regenerateWindows()` runs the gap-finder to produce
  `study_windows`.
- **Mobile** reads device calendars with **`expo-calendar`** and POSTs busy
  periods to `POST /api/calendar/sync` with `{ busyPeriods: [{start,end}] }`.
  The backend stores them under a per-user "device" connection and runs the same
  gap-finder, so windows match web. Alternatively, mobile can reuse OAuth via
  `signInWithOAuth` and call sync with no body (same path as web).
- Writing a completed session is identical on both: `POST /api/calendar/sessions`.

---

## 8. What changed in the backend for mobile (DONE)

- `lib/supabase/server.ts` — `createClient()` now also accepts a Supabase access
  token via the `Authorization: Bearer` header; every existing API route serves
  the mobile app unchanged.
- `proxy.ts` — CORS for `/api/*` (allows `Authorization`, answers OPTIONS
  preflight). Wildcard origin is safe because auth is token-based, not cookies.
- **Native push:** `POST/DELETE /api/push/register-mobile` stores Expo push
  tokens (`mobile_push_tokens` table). The `send-notifications` cron now
  dispatches to BOTH web (VAPID) and mobile (Expo Push API) from the same
  reliable-nudge payload, sharing the rolling-7-day cap and topic recommender.
- **Device calendar ingest:** `POST /api/calendar/sync` accepts
  `{ busyPeriods: [{start,end}] }` from `expo-calendar`; it stores them under a
  per-user "device" connection and runs the same server-side gap-finder, so
  windows are identical across platforms.
- **Reliability fix:** `regenerateWindows()` now inserts via `createMany({
  skipDuplicates: true })` — reconciliation no longer crashes on the
  `(userId,startTime,endTime)` unique constraint (important now that the cron
  runs every 5 min).

### New mobile endpoints (also listed in §4)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/push/register-mobile` | `{ expoPushToken, platform? }` | idempotent upsert |
| DELETE | `/api/push/register-mobile` | `{ expoPushToken }` | on sign-out / revoke |
| POST | `/api/calendar/sync` | `{ busyPeriods: [{start,end}] }` | device-calendar ingest → windows |

---

## 9. Mobile migration checklist (from FastAPI/Mongo → shared backend)

- [ ] Point `EXPO_PUBLIC_BACKEND_URL` at the web domain; drop the FastAPI URL.
- [ ] Replace session-token auth with Supabase Auth (§3); store token in SecureStore.
- [ ] Swap `src/api/client.ts` to attach `Authorization: Bearer <supabase token>`.
- [ ] Map screens to the endpoints in §4 (plan, windows, stats, sessions, infeasibility).
- [ ] Replace Emergent push relay with Expo push token registration via
      `POST /api/push/register-mobile` (§6; backend live).
- [ ] AI "insights": point Home at `GET /api/insights` (live on Next; replaces FastAPI
      `/api/plans/{id}/insights` when the Home screen migrates).
- [ ] Retire the Mongo data store — Supabase is the single source of truth.

---

*Generated for the MentorForge mobile build. Backend source of truth:
`/app/mentorforge` (Next.js 16 + Prisma + Supabase).*
