import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonical domain redirect.
 *
 * Why:
 * - Supabase auth cookies + OAuth state checks are origin-sensitive.
 * - Google/Microsoft OAuth redirect URIs are configured for the canonical domain.
 * - Plausible tracks a specific `data-domain`.
 *
 * This keeps users on one hostname so OAuth and analytics don't silently break.
 */
export function middleware(req: NextRequest) {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!canonical) return NextResponse.next();

  let canonicalUrl: URL;
  try {
    canonicalUrl = new URL(canonical);
  } catch {
    return NextResponse.next();
  }

  const host = req.headers.get("host")?.toLowerCase();
  if (!host) return NextResponse.next();

  // If already on canonical host, do nothing.
  if (host === canonicalUrl.host.toLowerCase()) return NextResponse.next();

  // Redirect everything else to the canonical host, preserving path + query.
  const url = req.nextUrl.clone();
  url.protocol = canonicalUrl.protocol;
  url.host = canonicalUrl.host;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    /*
     * Skip Next.js internals and static assets.
     */
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};

