---
# MentorForge — Mobile Google Sign-In (Expo + Supabase)

> **Flow (EAS / production build):** `@react-native-google-signin/google-signin` → `supabase.auth.signInWithIdToken()` → Supabase session.
> **Flow (Expo Go):** browser OAuth via `expo-web-browser` → session from redirect (`mentorforge://auth/callback`). Native Google module is **not** loaded in Expo Go (avoids `RNGoogleSignin` crash).
> The Next.js backend (https://www.mentorforge.co) already validates Supabase Bearer tokens — **no backend changes needed**.
> Prefer an EAS development build for production-like Google Sign-In; Expo Go uses the browser fallback.

## Supabase project
- Project ref: `dgooxbxnyaoallvwdsxq`
- Auth callback URL (for the Google **Web** client): `https://dgooxbxnyaoallvwdsxq.supabase.co/auth/v1/callback`
- Confirm the exact Project URL under Supabase → Settings → API.

## Ownership / order of operations
1. Backend owner shares the Google Cloud project (has the existing **Web** client).
2. Mobile team creates **iOS** + **Android** OAuth clients (below) and sends the two Client IDs back.
3. Backend owner configures Supabase → Auth → Providers → Google:
   - Client IDs comma-separated, **Web ID first**: `WEB,IOS,ANDROID`
   - Web client secret pasted in.
   - Auth → URL Configuration: keep `SITE_URL` unchanged; add redirect `mentorforge://**`.

## App identifiers
- iOS bundleIdentifier: `com.mentorforge.app`
- Android package: `com.mentorforge.app`
- Expo scheme: `mentorforge`

## Step 1 — Create Google OAuth clients (same project as the Web client)
- **iOS client**: Bundle ID `com.mentorforge.app`. Save Client ID + reversed client ID (`com.googleusercontent.apps.XXXX-YYYY`).
- **Android client**: package `com.mentorforge.app` + SHA-1. Get SHA-1 via `eas credentials` (add BOTH debug + release fingerprints).
- Send iOS + Android Client IDs to the backend owner.

## Step 2 — Install

Run in the **Expo mobile app** repo (not this Next.js backend):

```bash
npm i @supabase/supabase-js @react-native-google-signin/google-signin
npx expo install expo-secure-store react-native-url-polyfill
```

Use two commands — do **not** chain `npx expo install` onto `npm i` in one line (npm will treat `npx` / `expo` / `install` as package names).

## Step 3 — app.config.ts
```ts
export default {
  expo: {
    name: 'MentorForge',
    slug: 'mentorforge',
    scheme: 'mentorforge',
    ios: { bundleIdentifier: 'com.mentorforge.app' },
    android: { package: 'com.mentorforge.app' },
    plugins: [
      ['@react-native-google-signin/google-signin',
        { iosUrlScheme: 'com.googleusercontent.apps.XXXX-YYYY' }],
    ],
  },
}
```
