import { Resend } from "resend";

let cached: Resend | null = null;

/** Returns the Resend client, or null when no API key is configured (dev fallback). */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Kiribé <hello@kiribeonline.com>";

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
  if (!resend) return false;

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
