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
  // Match both regular specs and *.setup.ts. The `setup` project scopes itself
  // further via its own testMatch below.
  testMatch: /.*(\.spec|\.setup)\.ts$/,
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
    // CSRF middleware (`assertSameOrigin`) rejects state-changing requests
    // whose Origin/Referer isn't on the allowlist. Playwright's
    // APIRequestContext + programmatic `page.request` calls don't set
    // `Origin` by default, so any test that POSTs to /api/admin/* would
    // 403 with "Missing Origin/Referer". Force the header to the same
    // origin the server is bound to so real user traffic is what tests
    // exercise — not a stripped-header edge case.
    extraHTTPHeaders: {
      Origin: baseURL,
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Runs once, logs in via the UI, and writes `e2e/.auth/admin.json`. Every
    // authed spec inherits that cookie via `storageState`, keeping us clear
    // of the 5-per-15-min login rate limit that would fire if each spec's
    // beforeEach logged in on its own.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
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
