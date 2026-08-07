import type { NewsletterResult } from "./mailchimp.types";
import {
  isNewsletterConfigured,
  unsubscribeNewsletterMember,
  upsertNewsletterMember,
} from "./mailchimp.service";

/**
 * Public newsletter API. Callers never talk to Mailchimp directly — they go
 * through this facade so the platform behind the newsletter can be swapped
 * later without touching every route that subscribes a user.
 *
 * Every call returns a `NewsletterResult` and never throws. That keeps the
 * write path resilient — a Mailchimp outage should never block a
 * double-opt-in confirmation on our side.
 */

export type SubscribeToNewsletterInput = {
  email: string;
  /** Freeform source label ("website", "confirm-flow", "manual") — logged
   *  to Mailchimp as SOURCE and used in reporting. */
  source?: string;
  /** Set to `true` once the user has completed our own double-opt-in flow so
   *  Mailchimp can mark them as `subscribed` immediately. Set to `false` (the
   *  default) when we want Mailchimp to send its own confirmation email. */
  alreadyConfirmed?: boolean;
};

/**
 * Push a subscriber into the Mailchimp audience. Idempotent — repeat calls
 * for the same email either update tags/merge fields or fall through as a
 * no-op depending on Mailchimp state.
 */
export async function subscribeToNewsletter(
  input: SubscribeToNewsletterInput
): Promise<NewsletterResult> {
  return upsertNewsletterMember({
    email: input.email,
    status: input.alreadyConfirmed ? "subscribed" : "pending",
    source: input.source ?? "website",
    mergeFields: input.source ? { SOURCE: input.source } : undefined,
  });
}

/**
 * Unsubscribe an email address from the Mailchimp audience. Soft — the row
 * stays in Mailchimp, just flipped to `unsubscribed`, so the same address
 * can re-opt-in later without extra cleanup.
 */
export async function unsubscribeFromNewsletter(
  email: string
): Promise<NewsletterResult> {
  return unsubscribeNewsletterMember(email);
}

export { isNewsletterConfigured };
