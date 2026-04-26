import { expect, test } from "@playwright/test";

test("tracks pricing_viewed on /pricing", async ({ page }) => {
  const calls: Array<{ event: string; props: Record<string, string> }> = [];

  await page.addInitScript(() => {
    // @ts-expect-error - injected into browser context
    window.__plausibleCalls = [];

    // Capture calls even if Plausible overwrites `window.plausible` later.
    // @ts-expect-error - injected into browser context
    window.__plausibleImpl = undefined;
    Object.defineProperty(window, "plausible", {
      configurable: true,
      get() {
        // @ts-expect-error - injected into browser context
        const impl = window.__plausibleImpl;
        return (event: string, options?: { props?: Record<string, string> }) => {
          // @ts-expect-error - injected into browser context
          window.__plausibleCalls.push({ event, props: options?.props ?? {} });
          if (typeof impl === "function") return impl(event, options);
        };
      },
      set(v) {
        // @ts-expect-error - injected into browser context
        window.__plausibleImpl = v;
      },
    });
  });

  await page.goto("/pricing");

  // `TrackEventOnMount` fires in a React effect, so wait for it.
  await page.waitForFunction(() => {
    // @ts-expect-error - injected into browser context
    return (window.__plausibleCalls ?? []).some((c: any) => c.event === "pricing_viewed");
  });

  const raw = await page.evaluate(() => {
    // @ts-expect-error - injected into browser context
    return window.__plausibleCalls as Array<{ event: string; props: Record<string, string> }>;
  });
  calls.push(...raw);

  expect(calls.some((c) => c.event === "pricing_viewed")).toBe(true);
});

test("tracks purchase_completed on /success", async ({ page }) => {
  const calls: Array<{ event: string; props: Record<string, string> }> = [];

  await page.addInitScript(() => {
    // @ts-expect-error - injected into browser context
    window.__plausibleCalls = [];

    // Capture calls even if Plausible overwrites `window.plausible` later.
    // @ts-expect-error - injected into browser context
    window.__plausibleImpl = undefined;
    Object.defineProperty(window, "plausible", {
      configurable: true,
      get() {
        // @ts-expect-error - injected into browser context
        const impl = window.__plausibleImpl;
        return (event: string, options?: { props?: Record<string, string> }) => {
          // @ts-expect-error - injected into browser context
          window.__plausibleCalls.push({ event, props: options?.props ?? {} });
          if (typeof impl === "function") return impl(event, options);
        };
      },
      set(v) {
        // @ts-expect-error - injected into browser context
        window.__plausibleImpl = v;
      },
    });
  });

  await page.goto("/success");

  // `TrackEventOnMount` fires in a React effect, so wait for it.
  await page.waitForFunction(() => {
    // @ts-expect-error - injected into browser context
    return (window.__plausibleCalls ?? []).some((c: any) => c.event === "purchase_completed");
  });

  const raw = await page.evaluate(() => {
    // @ts-expect-error - injected into browser context
    return window.__plausibleCalls as Array<{ event: string; props: Record<string, string> }>;
  });
  calls.push(...raw);

  expect(calls.some((c) => c.event === "purchase_completed")).toBe(true);
});

