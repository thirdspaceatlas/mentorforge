import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Supabase client bound to the incoming request cookies (required in Route Handlers).
 * `applyCookiesToResponse` must be called on the final `NextResponse` so refreshed
 * session tokens from `getUser()` are persisted (see @supabase/ssr Route Handler docs).
 */
export function createSupabaseRouteHandlerClient(request: NextRequest) {
  let cookiesToSet: { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          cookiesToSet = toSet.map(({ name, value, options }) => ({ name, value, options }));
        }
      }
    }
  );

  function applyCookiesToResponse<T extends NextResponse>(response: T): T {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  return { supabase, applyCookiesToResponse };
}
