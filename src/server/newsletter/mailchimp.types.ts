/**
 * Mailchimp member status vocabulary. `subscribed` and `unsubscribed` are the
 * only two we ever write; the rest can come back from Mailchimp when we read
 * a member back. Kept exhaustive so callers don't silently ignore states.
 */
export type MailchimpStatus =
  | "subscribed"
  | "unsubscribed"
  | "pending"
  | "cleaned"
  | "transactional"
  | "archived";

export type UpsertMemberInput = {
  email: string;
  /** Set `subscribed` when double-opt-in is already handled on our side. Set
   *  `pending` to trigger Mailchimp's own confirmation email. */
  status: "subscribed" | "pending";
  /** Optional merge fields shown to campaign authors (FNAME, LNAME, SOURCE). */
  mergeFields?: Record<string, string>;
  /** Optional tags — used for segmentation in Mailchimp. */
  tags?: string[];
  /** Source label for audit + Mailchimp merge field. */
  source?: string;
};

export type NewsletterResult =
  | { ok: true; status: MailchimpStatus }
  | { ok: false; reason: NewsletterFailureReason };

export type NewsletterFailureReason =
  /** Env vars not populated — treat as "newsletter integration disabled". */
  | "not-configured"
  /** Mailchimp API rejected the request (validation, member cleaned, etc). */
  | "rejected"
  /** Network / DNS / timeout. */
  | "transport"
  /** Anything else, including a 5xx from Mailchimp. */
  | "unknown";
