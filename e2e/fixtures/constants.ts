/**
 * Shared constants for the E2E smoke suite. Keeping magic strings in one place
 * so specs and the test-seed script stay in agreement about what got seeded.
 */

export const SMOKE_ADMIN_EMAIL =
  process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "e2e-admin@kiribeonline.test";
export const SMOKE_ADMIN_PASSWORD =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "e2e-admin-password-12345";
export const SMOKE_ADMIN_NAME = "E2E Admin";

export const SMOKE_CATEGORY_NAME = "E2E Smoke";
export const SMOKE_CATEGORY_SLUG = "e2e-smoke";

export const SMOKE_ARTICLE_TITLE = "E2E Smoke: Published Article";
export const SMOKE_ARTICLE_SLUG = "e2e-smoke-published-article";
export const SMOKE_ARTICLE_EXCERPT =
  "Seeded by the E2E smoke suite. Verifies the public read path.";
export const SMOKE_ARTICLE_BODY_TEXT =
  "This body text exists solely so smoke tests can confirm the public article page renders.";
