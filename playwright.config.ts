import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration — minimum-viable smoke coverage for the money paths.
 *
 * - `baseURL` comes from `PLAYWRIGHT_BASE_URL`; defaults to a local dev origin.
 * - `webServer` boots a built app (`next build && next start`) so we test the
 *   same code path as production. In CI we don't reuse (fresh server); locally
 *   we reuse whatever is already listening on the port so devs can rerun fast.
 * - Retries only in CI: local runs stay honest about flaky tests.
 *
 * See docs/GIT-WORKFLOW.md — smoke suite is a separate CI job, not required
 * for merge yet.
 */

const isCI = !!process.env.CI;
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NODE_ENV: "production",
      PORT: String(PORT),
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_API_URL: baseURL,
      // Keep the studio disabled — we drive the custom /admin only.
      DISABLE_PAYLOAD_STUDIO: "true",
    },
  },
});
