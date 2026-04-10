/**
 * Validates public Supabase client env (URL + client API key).
 * Supports legacy anon JWT and newer publishable keys (`sb_publishable_...`).
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) {
      missing.push(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
    }
    throw new Error(
      `Missing Supabase env: ${missing.join(", ")}. Copy from Supabase → Project Settings → API. See .env.example.`
    );
  }
  return { url, anonKey };
}
