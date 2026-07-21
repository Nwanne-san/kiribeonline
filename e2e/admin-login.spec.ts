import { expect, test } from "@playwright/test";

import { SMOKE_ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD } from "./fixtures/constants";

// This spec exercises the login flow itself, so it must run against a fresh
// context — bypass the auth.setup storageState the other specs inherit.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Smoke: admin login form works end-to-end and error state renders.
 *
 * `/admin` redirects to `/admin/dashboard` — that's the "landed in admin"
 * signal after a valid login. We rely on the login route enum, not a
 * hardcoded path, via string literals kept aligned with `AdminRoutes`.
 */
test.describe("Admin login", () => {
  test("bad password shows the generic error and stays on login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(SMOKE_ADMIN_EMAIL);
    await page.getByRole("textbox", { name: /^Password/ }).fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    // Still on the login screen.
    expect(new URL(page.url()).pathname).toBe("/admin/login");
  });

  test("valid credentials land in the admin shell", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(SMOKE_ADMIN_EMAIL);
    await page.getByRole("textbox", { name: /^Password/ }).fill(SMOKE_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // /admin → /admin/dashboard is the configured redirect (next.config).
    await page.waitForURL(/\/admin\/(dashboard|articles|homepage)/, { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toMatch(/^\/admin\//);
    expect(new URL(page.url()).pathname).not.toBe("/admin/login");
  });
});
