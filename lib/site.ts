import type { NextRequest } from "next/server";

/**
 * Origin for auth redirect URLs (signup confirmation, password reset).
 * In the browser, prefers `window.location.origin` so links match the hostname
 * the user actually used (avoids `ww.` vs `www` mismatches when env is wrong).
 * Server-side falls back to `NEXT_PUBLIC_SITE_URL`, then localhost.
 */
export function getPublicSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* invalid NEXT_PUBLIC_SITE_URL */
    }
  }
  return "http://localhost:3000";
}

/** Canonical site origin for metadata (Open Graph, canonical URLs). Set NEXT_PUBLIC_SITE_URL on Vercel for a custom domain. */
export function getSiteUrl(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

/**
 * Origin of the **current** request — use for Stripe `success_url` / `cancel_url` so the
 * browser returns to the same host it used (avoids losing cookies when env says `localhost`
 * but the user opened `127.0.0.1`, or vice versa).
 */
export function getRequestOriginUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      const envUrl = new URL(fromEnv);
      const requestHost = request.headers.get("host")?.toLowerCase();
      if (requestHost && envUrl.host.toLowerCase() === requestHost) {
        return envUrl.origin;
      }
    } catch {
      /* invalid NEXT_PUBLIC_SITE_URL */
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0].trim();
    const proto = forwardedProto?.split(",")[0].trim() ?? "https";
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
