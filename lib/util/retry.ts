/**
 * Retry helper for transient external failures (calendar providers, push APIs).
 * Retries network errors, 5xx, and 429 — never 401/404/410 or other 4xx.
 */

export class HttpStatusError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpStatusError";
    this.status = status;
  }
}

const DEFAULT_DELAYS_MS = [250, 1000];

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof HttpStatusError) {
    return isRetryableHttpStatus(err.status);
  }

  if (err && typeof err === "object" && "statusCode" in err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (typeof status === "number") {
      if (status === 401 || status === 404 || status === 410) return false;
      if (isRetryableHttpStatus(status)) return true;
      if (status >= 400 && status < 500) return false;
    }
  }

  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("econn")) {
      return true;
    }
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; delaysMs?: number[] },
): Promise<T> {
  const retries = opts?.retries ?? 2;
  const delays = opts?.delaysMs ?? DEFAULT_DELAYS_MS;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries || !isRetryableError(err)) throw err;
      const delay = delays[Math.min(attempt, delays.length - 1)] ?? delays.at(-1) ?? 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}
