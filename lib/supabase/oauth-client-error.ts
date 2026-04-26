function decodeOAuthDescription(raw: string): string {
  let message = raw.replace(/\+/g, " ");
  try {
    message = decodeURIComponent(message);
  } catch {
    /* keep partially decoded */
  }
  return message;
}

/** Supabase OAuth failures in the URL hash, e.g. `#error=server_error&error_description=...`. */
export function consumeOAuthHashMessage(): string | null {
  if (typeof window === "undefined") return null;

  const u = new URL(window.location.href);
  if (u.hash.length <= 1) return null;

  const p = new URLSearchParams(u.hash.slice(1));
  const desc = p.get("error_description");
  const err = p.get("error") || p.get("error_code");
  if (!desc && !err) return null;

  const raw = (desc?.trim() ? desc : err) ?? "";
  const message = decodeOAuthDescription(raw);
  u.hash = "";
  window.history.replaceState({}, "", u.pathname + u.search);
  return message;
}

/** `/auth/callback` and similar redirects use query params: `?error=...&reason=...`. */
export function consumeOAuthQueryMessage(): string | null {
  if (typeof window === "undefined") return null;

  const u = new URL(window.location.href);
  const err = u.searchParams.get("error");
  const reason = u.searchParams.get("reason") ?? u.searchParams.get("error_description");
  if (!err && !reason) return null;

  const message = (reason?.trim() ? reason : err) ?? "";
  u.searchParams.delete("error");
  u.searchParams.delete("reason");
  u.searchParams.delete("error_description");
  const qs = u.searchParams.toString();
  window.history.replaceState({}, "", u.pathname + (qs ? `?${qs}` : ""));
  return message;
}

/**
 * Login / register: Supabase may return client-side OAuth errors in the **hash**,
 * while `/auth/callback` uses **query** params for server-side errors.
 */
export function consumeOAuthClientRedirectMessage(): string | null {
  return consumeOAuthHashMessage() ?? consumeOAuthQueryMessage();
}
