import { createHash } from "node:crypto";
import type {
  MailchimpStatus,
  NewsletterResult,
  UpsertMemberInput,
} from "./mailchimp.types";

/**
 * Thin, dependency-free Mailchimp Marketing API v3.0 client.
 *
 * Kept intentionally small: the platform-owned client SDK (`@mailchimp/mailchimp_marketing`)
 * ships a lot of surface area we won't use and drags in axios. A fetch-based
 * upsert + status-flip covers every write the app performs today.
 *
 * All calls are lazy — a request only fires when `isNewsletterConfigured()`
 * returns true. Every failure path returns a structured `NewsletterResult`
 * so callers can log, retry, or degrade gracefully; nothing throws.
 */

/** Env-driven config. Reads on each call so a serverless cold start picks
 *  up rotated keys without a redeploy. */
function readConfig() {
  return {
    apiKey: process.env.MAILCHIMP_API_KEY ?? "",
    serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX ?? "",
    audienceId: process.env.MAILCHIMP_AUDIENCE_ID ?? "",
    /** Optional Mailchimp double-opt-in override; `pending` uses Mailchimp's
     *  own confirmation flow, `subscribed` trusts the caller. */
    forceDoubleOptIn: process.env.MAILCHIMP_FORCE_DOI === "true",
  };
}

export function isNewsletterConfigured(): boolean {
  const { apiKey, serverPrefix, audienceId } = readConfig();
  return Boolean(apiKey && serverPrefix && audienceId);
}

/** Mailchimp identifies a member by MD5 of the lowercased email address. */
function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

function baseUrl(): string {
  const { serverPrefix, audienceId } = readConfig();
  return `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}`;
}

function authHeader(): string {
  const { apiKey } = readConfig();
  // Mailchimp's docs use HTTP Basic with "anystring:apikey". The username is
  // ignored server-side but must be non-empty.
  return `Basic ${Buffer.from(`kiribe:${apiKey}`).toString("base64")}`;
}

/** Log line prefix — grep-friendly and PII-free (no email address in logs). */
const LOG = "[newsletter]";

async function mailchimpFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const url = `${baseUrl()}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init.headers ?? {}),
    },
    // Cap the wait so a Mailchimp incident can't stall our request path.
    signal: init.signal ?? AbortSignal.timeout(8_000),
  });
}

/**
 * Upsert (add-or-update) a member. Uses PUT which is idempotent — a repeat
 * subscribe for an existing address won't error, and won't accidentally
 * resurrect an `unsubscribed` member unless the caller sets status to
 * "subscribed" explicitly (Mailchimp will reject that with 400 for
 * previously-cleaned addresses, which we surface as `rejected`).
 */
export async function upsertNewsletterMember(
  input: UpsertMemberInput
): Promise<NewsletterResult> {
  if (!isNewsletterConfigured()) return { ok: false, reason: "not-configured" };

  const { forceDoubleOptIn } = readConfig();
  const hash = subscriberHash(input.email);
  const status = forceDoubleOptIn && input.status === "subscribed" ? "pending" : input.status;

  const body = {
    email_address: input.email,
    status_if_new: status,
    status,
    merge_fields: input.mergeFields,
  };

  try {
    const res = await mailchimpFetch(`/members/${hash}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `${LOG} upsert rejected: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`
      );
      return { ok: false, reason: res.status >= 500 ? "unknown" : "rejected" };
    }
    // Attach any tags separately — Mailchimp's PUT endpoint doesn't accept
    // tags in the same payload.
    if (input.tags && input.tags.length) {
      await mailchimpFetch(`/members/${hash}/tags`, {
        method: "POST",
        body: JSON.stringify({
          tags: input.tags.map((name) => ({ name, status: "active" })),
        }),
      }).catch((err) => {
        // Non-fatal: subscription is what matters, tags are for segmentation.
        console.warn(`${LOG} tag write failed`, err);
      });
    }
    const parsed = (await res.json()) as { status?: MailchimpStatus };
    return {
      ok: true,
      // Prefer Mailchimp's own reported status (e.g. 'pending' when DOI is
      // in effect on the audience). Fall back to what we requested.
      status: parsed.status ?? status,
    };
  } catch (err) {
    // AbortSignal timeout or DNS/network failure.
    console.warn(`${LOG} transport failure`, err);
    return { ok: false, reason: "transport" };
  }
}

/**
 * Unsubscribe a member. Mailchimp permits this via a PATCH with status;
 * we set `unsubscribed` (soft — the member row stays, just marked out).
 * Deleting is intentionally not offered here; use the Mailchimp UI for
 * permanent removals so an accidental app bug can't wipe an audience row.
 */
export async function unsubscribeNewsletterMember(
  email: string
): Promise<NewsletterResult> {
  if (!isNewsletterConfigured()) return { ok: false, reason: "not-configured" };
  const hash = subscriberHash(email);
  try {
    const res = await mailchimpFetch(`/members/${hash}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "unsubscribed" }),
    });
    if (!res.ok) {
      // A 404 here is fine — the member never made it into the audience, so
      // there's nothing to unsubscribe. Everything else is a real problem.
      if (res.status === 404) return { ok: true, status: "unsubscribed" };
      const text = await res.text().catch(() => "");
      console.warn(
        `${LOG} unsubscribe rejected: ${res.status} ${res.statusText} — ${text.slice(0, 200)}`
      );
      return { ok: false, reason: res.status >= 500 ? "unknown" : "rejected" };
    }
    return { ok: true, status: "unsubscribed" };
  } catch (err) {
    console.warn(`${LOG} unsubscribe transport failure`, err);
    return { ok: false, reason: "transport" };
  }
}
