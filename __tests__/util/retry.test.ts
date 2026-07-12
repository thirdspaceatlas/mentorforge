import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HttpStatusError,
  isRetryableError,
  isRetryableHttpStatus,
  withRetry,
} from "@/lib/util/retry";

describe("retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("isRetryableHttpStatus matches 429 and 5xx only", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(404)).toBe(false);
    expect(isRetryableHttpStatus(401)).toBe(false);
  });

  it("isRetryableError rejects 4xx client errors", () => {
    expect(isRetryableError(new HttpStatusError("nope", 404))).toBe(false);
    expect(isRetryableError({ statusCode: 410 })).toBe(false);
    expect(isRetryableError({ statusCode: 401 })).toBe(false);
  });

  it("isRetryableError accepts transient failures", () => {
    expect(isRetryableError(new HttpStatusError("busy", 503))).toBe(true);
    expect(isRetryableError({ statusCode: 429 })).toBe(true);
    expect(isRetryableError(new TypeError("fetch failed"))).toBe(true);
  });

  it("withRetry succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("withRetry retries transient errors then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpStatusError("503", 503))
      .mockRejectedValueOnce(new HttpStatusError("503", 503))
      .mockResolvedValue("ok");

    const p = withRetry(fn);
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("withRetry does not retry 404", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpStatusError("gone", 404));
    await expect(withRetry(fn)).rejects.toThrow("gone");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
