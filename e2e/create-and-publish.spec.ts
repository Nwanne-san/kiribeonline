import { expect, test } from "@playwright/test";

import {
  SMOKE_ADMIN_EMAIL,
  SMOKE_ADMIN_PASSWORD,
  SMOKE_CATEGORY_SLUG,
} from "./fixtures/constants";

/**
 * Smoke: an authenticated admin can create + publish an article, and the
 * public site immediately serves it.
 *
 * The article editor is a rich Lexical-backed form (media picker, chip
 * selects, checklists) — driving every field through the UI would make the
 * suite dependent on internal editor DOM structure. Per the smoke plan, we
 * still exercise the editor form for at least a title, then complete the
 * create + publish through the admin REST API, which is the same code path
 * the editor calls. Public retrieval is the real assertion.
 */
test.describe("Create → Publish", () => {
  // Deterministic-ish slug per run so we don't collide with an earlier run's
  // article on a persisted DB.
  const slug = `e2e-created-${Date.now()}`;
  const title = `E2E Created ${slug}`;
  const bodyText = "Playwright created this article and it publishes end-to-end.";

  test("admin creates a published article that shows on the public site", async ({
    page,
    request,
  }) => {
    // 1. Log in via UI so cookies land on the browser context.
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(SMOKE_ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(SMOKE_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin\//, { timeout: 15_000 });

    // 2. Exercise the editor form. We land on the new-article page and put
    //    a title into the KiribeTextField so we've proven the form mounts
    //    for an authenticated admin. Full body input is via API (below) —
    //    keeps the spec resilient to Lexical editor churn.
    await page.goto("/admin/articles/new");
    await expect(page.getByLabel("Title")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Title").fill(title);
    await expect(page.getByLabel("Title")).toHaveValue(title);

    // 3. Look up the target category id so we can attach it on create.
    const catRes = await page.request.get("/api/admin/categories");
    expect(catRes.status()).toBe(200);
    const catJson = await catRes.json();
    const categories: Array<{ id: string | number; slug: string }> =
      catJson.data?.docs ?? catJson.docs ?? [];
    const smokeCat = categories.find((c) => c.slug === SMOKE_CATEGORY_SLUG);
    expect(smokeCat, "smoke category should be seeded").toBeTruthy();

    // 4. Create + publish via the admin REST API. This exercises capability
    //    check + publish escalation guard on the same auth cookie.
    const createRes = await page.request.post("/api/admin/articles", {
      data: {
        title,
        slug,
        excerpt: "Created and published by the E2E smoke suite.",
        bodyText,
        categoryIds: [smokeCat!.id],
        status: "published",
        publishedAt: new Date().toISOString(),
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(200);

    // 5. Public verification — a fresh request context (no admin cookies)
    //    so we're proving the public read path, not a session leak.
    const publicRes = await request.get(`/articles/${slug}`);
    expect(publicRes.status()).toBe(200);
    const publicHtml = await publicRes.text();
    expect(publicHtml).toContain(title);
    expect(publicHtml).toContain(bodyText);
  });
});
