import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { url, anonKey } = getSupabaseEnv();

  // Mobile clients (Expo) authenticate with a Supabase access token in the
  // Authorization header instead of session cookies. When one is present we
  // return a client whose auth.getUser() validates that bearer token, so every
  // existing cookie-based API route serves the mobile app with ZERO per-route
  // changes. Web (cookie) requests are unaffected — no Authorization header.
  const authHeader = headerStore.get("authorization") ?? undefined;
  const bearer =
    authHeader && /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : undefined;

  const client = createServerClient(url, anonKey, {
    ...(bearer ? { global: { headers: { Authorization: `Bearer ${bearer}` } } } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component — ignore */
        }
      }
    }
  });

  if (bearer) {
    // Force getUser() (called arg-less across all routes) to validate the token.
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = ((jwt?: string) => originalGetUser(jwt ?? bearer)) as typeof client.auth.getUser;
  }

  return client;
}
