import { expect, test } from "@playwright/test";

/**
 * Smoke: subscribe round-trip.
 *
 * The full form lives inside a MUI modal opened from a floating button, and
 * the real confirmation email (Resend double opt-in) can't be verified from a
 * test — so we drive the public API directly, which is what the modal calls.
 *
 * That still exercises: request validation, honeypot handling, rate-limit
 * plumbing, subscribe service, and the shared apiSuccess response contract.
 */
test.describe("Subscribe round-trip", () => {
  test("valid submission returns success", async ({ request }) => {
    // Randomize the email so the per-email side of the double-opt-in flow
    // never bumps into a pre-confirmed record from a previous run.
    const email = `e2e+${Date.now()}@kiribeonline.test`;
    const res = await request.post("/api/subscribe", {
      data: { email, consent: true, website: "" },
    });
    expect(res.status(), await res.text()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // apiSuccess wraps the service response; the confirmation copy lives in
    // `message` for the double-opt-in path (and `data.message` for the payload).
    const message = json.message ?? json.data?.message ?? "";
    expect(message).toMatch(/confirm|check your inbox|subscribed/i);
  });

  test("missing consent is rejected", async ({ request }) => {
    const res = await request.post("/api/subscribe", {
      data: {
        email: `e2e+noconsent+${Date.now()}@kiribeonline.test`,
        consent: false,
        website: "",
      },
    });
    // parseBody throws a ValidationError → handleRouteError returns 422.
    // We accept the whole 4xx family to stay resilient to that boundary.
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
