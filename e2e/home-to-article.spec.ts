import { expect, test } from "@playwright/test";

import {
  SMOKE_ARTICLE_BODY_TEXT,
  SMOKE_ARTICLE_SLUG,
  SMOKE_ARTICLE_TITLE,
} from "./fixtures/constants";

/**
 * Smoke: home page renders, then a click through to the seeded article shows
 * the body copy on the article page.
 *
 * We don't assert which section on the homepage owns the link — the smoke
 * article may or may not be surfaced by the homepage globals depending on
 * editors' picks state. We only require that:
 *   1. `/` renders 200 with the site brand copy,
 *   2. Navigating directly to the article page renders the title + body.
 * That is enough to prove SSR + Payload → public read is alive end-to-end.
 */
test.describe("Home → Article", () => {
  test("homepage responds and the seeded article page renders body copy", async ({
    page,
  }) => {
    // 1. Homepage renders.
    const homeResponse = await page.goto("/");
    expect(homeResponse?.status(), "home should be 200/OK-ish").toBeLessThan(400);
    // Brand mark is on every layout — a stable anchor across design changes.
    await expect(
      page.getByRole("link", { name: /kirib/i }).first(),
    ).toBeVisible();

    // 2. Article page — the money path is that the public deep link resolves
    //    and the body copy actually renders (i.e. the Lexical converter chain
    //    hasn't quietly broken).
    const articleResponse = await page.goto(`/articles/${SMOKE_ARTICLE_SLUG}`);
    expect(articleResponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: SMOKE_ARTICLE_TITLE }),
    ).toBeVisible();
    await expect(page.getByText(SMOKE_ARTICLE_BODY_TEXT)).toBeVisible();
  });
});
