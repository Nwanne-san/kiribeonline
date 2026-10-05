import { Resend } from "resend";

let cached: Resend | null = null;

const WORDMARK_FILENAME = "kiribe-wordmark-white.png";

/**
 * Public HTTPS URL for the white wordmark PNG rendered on the burgundy masthead.
 * Served from Vercel edge CDN / public assets, ensuring it renders reliably across
 * all webmail and native email clients without requiring file attachments.
 */
export function resolveWordmarkUrl(): string {
  if (process.env.EMAIL_ASSETS_BASE_URL) {
    return `${process.env.EMAIL_ASSETS_BASE_URL.replace(/\/$/, "")}/${WORDMARK_FILENAME}`;
  }
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
    return `${appUrl}/brand/${WORDMARK_FILENAME}`;
  }
  return `https://kiribeonline.com/brand/${WORDMARK_FILENAME}`;
}

export const WORDMARK_CONTENT_ID = "kiribe-wordmark";

/** Returns the Resend client, or null when no API key is configured (dev fallback). */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

const DEFAULT_FROM = "Kiribé <noreply@send.kiribeonline.com>";

/**
 * Nullish-coalescing (`??`) leaves an empty string in place, so an env file
 * that accidentally sets `RESEND_FROM_EMAIL=` (or line-wraps the value onto
 * the next line, which parses as empty) would ship `""` as the from-address
 * and every send would fail Resend validation with no obvious signal. Fall
 * back to the default when the value is missing OR blank.
 *
 * Vercel stores env var values verbatim, so pasting `"Name <x@y>"` (with
 * quotes) into the dashboard keeps the literal double quotes in the value —
 * Resend then rejects the whole string as malformed. Strip a single layer of
 * wrapping `"..."` or `'...'` so the format matches what dotenv already does.
 */
function resolveFromEmail(): string {
  const raw = process.env.RESEND_FROM_EMAIL?.trim();
  if (!raw) return DEFAULT_FROM;
  const unquoted = raw.replace(/^(['"])(.*)\1$/, "$2").trim();
  return unquoted || DEFAULT_FROM;
}

export const RESEND_FROM_EMAIL = resolveFromEmail();

export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Log prefix identifying the calling flow, e.g. `[users] password reset`. */
  context: string;
};

/**
 * Send one transactional email and report whether Resend actually accepted it.
 *
 * The Resend SDK resolves with `{ data, error }` instead of rejecting on an API
 * error, so a bare `await resend.emails.send(...)` inside a try/catch reports
 * success for every server-side rejection — unverified sending domain, a
 * recipient outside the test allowlist, a malformed `from`, quota exhaustion.
 * Callers were therefore told "sent" while nothing was delivered. This helper
 * is the only place that talks to the transport: it inspects `error`, logs the
 * real reason, and returns `false` so callers can run their fallback path.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  context,
}: SendEmailArgs): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      `${context} email skipped: RESEND_API_KEY environment variable is not configured.`
    );
    return false;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      // `error.name` is Resend's machine-readable code (e.g.
      // `validation_error`, `invalid_from_address`). Never log `to` — the
      // address is PII and the flows here are unauthenticated.
      console.error(
        `${context} email rejected by Resend: ${error.name} — ${error.message}`
      );
      return false;
    }

    if (!data?.id) {
      console.error(`${context} email returned no message id; treating as failed`);
      return false;
    }

    return true;
  } catch (err) {
    // Network/transport failure — the SDK does reject for these.
    console.error(`${context} email failed to send`, err);
    return false;
  }
}
