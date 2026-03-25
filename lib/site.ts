import type { NextRequest } from "next/server";

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
