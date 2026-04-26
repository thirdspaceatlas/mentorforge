import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isLocal = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

export default defineConfig({
  // Keep Playwright from discovering Vitest unit tests in `__tests__/`.
  // Only e2e/browser tests live here.
  testDir: "e2e",
  use: {
    baseURL,
  },
  // When running locally/CI, boot Next dev server automatically.
  // When running against a deployed environment, set PLAYWRIGHT_BASE_URL and
  // we will skip starting a local server.
  webServer: isLocal
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});

