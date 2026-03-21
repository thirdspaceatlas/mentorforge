# StudyForge

CFA study planning app built with [Next.js](https://nextjs.org/).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to GitHub

1. Install [Git for Windows](https://git-scm.com/download/win) (or use [GitHub Desktop](https://desktop.github.com/)).
2. Create an empty repo on GitHub (no README/license if you’ll push existing code): [github.com/dblackwealth/studyforge](https://github.com/dblackwealth/studyforge).
3. In this project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/dblackwealth/studyforge.git
git push -u origin main
```

If the remote already has commits, use `git pull origin main --allow-unrelated-histories` first, then push.

## Deploy on Vercel

1. Sign in at [vercel.com](https://vercel.com) with **GitHub**.
2. **Add New… → Project** → **Import** `dblackwealth/studyforge`.
3. Framework: **Next.js** (auto-detected). Build: `npm run build`, output default.
4. **Deploy**. Vercel will build on every push to `main`.

Optional: add env vars under **Project → Settings → Environment Variables** if you later add `.env` features (e.g. auth/database).
