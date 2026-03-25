export type CheckoutResult = {
  ok: boolean;
  status: number;
  url?: string;
  error?: string;
  raw: string;
};

export async function postCheckout(body: unknown): Promise<CheckoutResult> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  let parsed: { url?: string; error?: string } = {};
  try {
    parsed = JSON.parse(raw) as { url?: string; error?: string };
  } catch {
    /* non-JSON */
  }

  return {
    ok: res.ok,
    status: res.status,
    url: parsed.url,
    error: parsed.error,
    raw
  };
}
