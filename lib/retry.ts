/** Retry a transient async operation with simple fixed backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; delayMs?: number },
): Promise<T> {
  const retries = opts?.retries ?? 1;
  const delayMs = opts?.delayMs ?? 250;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastErr;
}
