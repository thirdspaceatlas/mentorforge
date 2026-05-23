# MentorForge

CFA study planning and pacing app built with [Next.js](https://nextjs.org/). Plan, pace, and rebalance your study path—not a tutoring marketplace.

## Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16 (App Router), React |
| Auth | Supabase Auth (`@supabase/ssr`), root `proxy.ts` for session refresh + `/app` gating |
| Database | Supabase Postgres via Prisma |
| Payments | Stripe Checkout + webhooks |
| Calendar Coach | Google Calendar + Outlook OAuth, encrypted tokens, cron sync |
| Notifications | Web Push + Vercel cron |
| Email | Resend (outreach cron) |
| Tests | Vitest (`__tests__/`), Playwright (`e2e/`) |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for request flow, study-plan persistence, and known schema drift.

## Requirements

- **Node.js 24.x** (`package.json` `engines`) — use `nvm use 24` or equivalent
- Copy [`.env.example`](./.env.example) to `.env` / `.env.local` and fill in values before running auth, DB, Stripe, or calendar features

## Local development

```bash
npm install   # runs prisma generate + patch-package via postinstall
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

```bash
npm run test:unit    # Vitest — calendar logic in __tests__/
npm run test:e2e     # Playwright — browser smoke in e2e/
```

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with **GitHub**.
2. **Add New… → Project** → **Import** your `mentorforge` repo.
3. Framework: **Next.js** (auto-detected). Build: `npm run build`.
4. Set **all** env vars from [`.env.example`](./.env.example) for Production (and Preview if needed).
5. Set **Node.js 24.x** in Project → Settings → General.
6. **Deploy**. Crons are defined in [`vercel.json`](./vercel.json) (requires **Vercel Pro** for sub-daily schedules).

### Production checklist

- `NEXT_PUBLIC_SITE_URL` — canonical origin; must match Supabase Auth → URL Configuration → Site URL and OAuth redirect allowlists
- Supabase redirect URLs include `https://<your-domain>/auth/callback` and calendar OAuth callback paths
- Stripe webhook endpoint → `/api/webhooks/stripe`
- `CRON_SECRET` on Vercel matches what cron routes expect

## Deploy to GitHub

Canonical remote (Third Space Atlas org):

```bash
git remote add origin https://github.com/thirdspaceatlas/mentorforge.git
git push -u origin main
```

### Vercel ↔ GitHub mismatch

Production deploys use the Vercel project **`studyforge`** (not the repo folder name). After moving the repo from `dblackwealth/mentorforge` to `thirdspaceatlas/mentorforge`, reconnect Git in the dashboard:

1. [GitHub → Settings → Applications → Vercel](https://github.com/settings/installations) → **Configure** → grant **thirdspaceatlas** org access and select the **mentorforge** repository.
2. [Vercel → studyforge → Settings → Git](https://vercel.com/thirdspaceatlas/studyforge/settings/git) → **Connect** → `thirdspaceatlas/mentorforge`, production branch `main`.
3. Trigger **Redeploy** on `main` once connected.

Until Git is reconnected, deploy from CLI: `vercel deploy --prod` (with `.vercel/project.json` linked to `studyforge`).

If the remote already has commits, use `git pull origin main --allow-unrelated-histories` first, then push.

## Cursor / cloud agents

Use **Node 24.x**, run `npm ci` on startup, and run `npm run test:unit` (not raw `vitest run` without the project config). Prisma client is generated in `postinstall`.
