/**
 * Verify Bearer auth against /api/insights (or any route).
 * Usage:
 *   TEST_AUTH_EMAIL=you@example.com TEST_AUTH_PASSWORD='...' \
 *     npx tsx scripts/verify-bearer-auth.ts
 *   npx tsx scripts/verify-bearer-auth.ts https://www.mentorforge.co
 */
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

async function main() {
  const base = process.argv[2]?.replace(/\/$/, "") ?? "http://localhost:3000";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const email = process.env.TEST_AUTH_EMAIL?.trim();
  const password = process.env.TEST_AUTH_PASSWORD?.trim();

  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / anon key");
  if (!email || !password) {
    throw new Error("Set TEST_AUTH_EMAIL and TEST_AUTH_PASSWORD to sign in and obtain a real access token");
  }

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(`signIn failed: ${error?.message ?? "no session"}`);
  }

  const token = data.session.access_token;
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  console.log("Supabase getUser(token):", userData.user?.id ?? "null", userErr?.message ?? "ok");

  const res = await fetch(`${base}/api/insights`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  console.log(`${base}/api/insights → ${res.status}`);
  console.log(body.slice(0, 500));
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
