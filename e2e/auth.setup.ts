import { expect, test as setup } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { SMOKE_ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD } from "./fixtures/constants";

/**
 * Log in once per run and persist the admin session cookie for every spec to
 * reuse. Playwright wires this into the `chromium` project via `dependencies`
 * and `storageState` (playwright.config.ts). Without it, each spec's own
 * `beforeEach` login would trip the 5-per-15-min login rate limit.
 */
export const ADMIN_STORAGE_STATE = "e2e/.auth/admin.json";

setup("authenticate admin", async ({ page }) => {
  mkdirSync(dirname(ADMIN_STORAGE_STATE), { recursive: true });

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(SMOKE_ADMIN_EMAIL);
  await page.getByRole("textbox", { name: /^Password/ }).fill(SMOKE_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/admin\/(dashboard|articles|homepage)/, { timeout: 15_000 });

  await expect(new URL(page.url()).pathname).not.toBe("/admin/login");
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
