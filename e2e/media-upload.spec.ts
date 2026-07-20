import { expect, test } from "@playwright/test";

import { SMOKE_ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD } from "./fixtures/constants";

/**
 * Smallest valid PNG we can send — a 1×1 transparent pixel. Real bytes so the
 * magic-byte + sharp decode check in `/api/admin/media` accepts it.
 */
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=";
const TINY_PNG = Buffer.from(TINY_PNG_BASE64, "base64");

/** Payload > 10MB — MAX_UPLOAD_BYTES cap in src/constants. */
const OVERSIZED_BYTES = 11 * 1024 * 1024;

/**
 * Smoke: authenticated admin can upload a valid image and an oversized upload
 * is rejected with 413. Exercises the byte-size limit and the auth guard.
 */
test.describe("Media upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(SMOKE_ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(SMOKE_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin\//, { timeout: 15_000 });
  });

  test("small PNG upload succeeds and appears in the library", async ({
    page,
  }) => {
    const alt = `E2E tiny png ${Date.now()}`;
    const res = await page.request.post("/api/admin/media", {
      multipart: {
        alt,
        file: {
          name: "tiny.png",
          mimeType: "image/png",
          buffer: TINY_PNG,
        },
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const created = await res.json();
    const doc = created.data ?? created;
    expect(doc.id ?? doc.doc?.id).toBeTruthy();
    expect(doc.alt ?? doc.doc?.alt).toBe(alt);

    // Library list should include the new alt text.
    const list = await page.request.get("/api/admin/media?limit=50");
    expect(list.status()).toBe(200);
    const listJson = await list.json();
    const items: Array<{ alt?: string }> =
      listJson.data?.docs ?? listJson.docs ?? [];
    expect(items.some((item) => item.alt === alt)).toBe(true);
  });

  test("oversized upload is rejected with 413", async ({ page }) => {
    // Buffer of the wrong "shape" — MAX_UPLOAD_BYTES fires before content-type
    // validation, so bytes don't need to be a real image.
    const huge = Buffer.alloc(OVERSIZED_BYTES, 0);
    const res = await page.request.post("/api/admin/media", {
      multipart: {
        alt: "should never persist",
        file: {
          name: "huge.png",
          mimeType: "image/png",
          buffer: huge,
        },
      },
    });
    expect(res.status()).toBe(413);
  });
});
