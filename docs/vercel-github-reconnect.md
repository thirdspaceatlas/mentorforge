# Reconnect Vercel (studyforge) to GitHub (thirdspaceatlas/mentorforge)

## What broke

| Layer | Was | Now |
|-------|-----|-----|
| Git remote | `dblackwealth/mentorforge` | `thirdspaceatlas/mentorforge` |
| Vercel project name | `studyforge` | unchanged (still `studyforge`) |
| Vercel Git link | `dblackwealth/mentorforge` | **disconnected** — must reconnect |

The app at **www.mentorforge.co** is served by the Vercel project **`studyforge`**, not a project named `mentorforge`. A duplicate empty `mentorforge` Vercel project may exist from a mistaken `vercel link`; delete it in the dashboard if present.

## Fix (dashboard — recommended)

### 1. GitHub: grant Vercel access to the new org/repo

1. Open https://github.com/settings/installations
2. Click **Vercel** → **Configure**
3. Under **Repository access**, ensure **thirdspaceatlas** is authorized and **mentorforge** is included (or “All repositories” for that org)
4. Save

If `thirdspaceatlas/mentorforge` does not appear, an org owner may need to approve the Vercel GitHub App for the organization.

### 2. Vercel: connect the studyforge project

1. Open https://vercel.com/thirdspaceatlas/studyforge/settings/git
2. **Connect Git Repository** → GitHub → **thirdspaceatlas/mentorforge**
3. Production branch: **main**
4. Save

### 3. Redeploy

1. Deployments → **Redeploy** latest `main`, or push an empty commit:

   ```bash
   git commit --allow-empty -m "chore: trigger Vercel deploy after Git reconnect"
   git push origin main
   ```

## CLI workaround (until Git is connected)

Link this repo to **studyforge** (not `mentorforge`):

```bash
# .vercel/project.json should point at studyforge:
# { "orgId": "team_VZ2qWYWQLzSe1hOEkOkslReh", "projectId": "prj_oDq0L74zPcjA8jIVnXfHyoS6Ysua", "projectName": "studyforge" }

vercel deploy --prod
```

`.vercel/` is gitignored; recreate `project.json` locally if needed.

## Verify

- Vercel → studyforge → Settings → Git shows `thirdspaceatlas/mentorforge` @ `main`
- A new push to `main` creates a deployment automatically
- Production URL still serves www.mentorforge.co (custom domain unchanged)

## Do not

- Create a second Vercel project named `mentorforge` unless you intend to migrate domains/env vars manually
- Point Supabase or OAuth redirect URLs at `studyforge-*.vercel.app` for production — use `https://www.mentorforge.co`
