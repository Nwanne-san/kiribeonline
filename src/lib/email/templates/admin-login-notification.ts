import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Security receipt sent after every successful admin sign-in. Tone: short and
 * matter of fact. The reader either recognises the session and moves on, or
 * they do not; the "wasn't you?" line is the whole point of the email.
 *
 * Location and device labels are best-effort. The OS/browser is parsed from
 * the User-Agent (short list of known matchers; unknowns read as "Unknown"
 * rather than echoing the raw UA) and the location comes from the platform
 * geo headers (Vercel), so both fields degrade to null when we cannot
 * resolve them. Rows with no value are dropped from the receipt.
 */
export function renderAdminLoginNotificationEmail({
  recipientName,
  signedInAtISO,
  device,
  location,
  helpUrl,
  brand = "Kiribé",
}: {
  recipientName?: string | null;
  /** ISO 8601 timestamp of the successful login. */
  signedInAtISO: string;
  device: { browser: string; os: string };
  location: string | null;
  /** Where to point a "wasn't you?" reader. Usually the reset-password page. */
  helpUrl: string;
  brand?: string;
}): EmailShellOutput {
  const firstName = recipientName?.trim().split(/\s+/)[0] ?? "there";
  const when = new Date(signedInAtISO).toUTCString();
  const deviceLabel = `${device.browser} on ${device.os}`;

  return renderEmailShell({
    subject: `New sign-in to your ${brand} admin`,
    preheader: `${deviceLabel}${location ? `, ${location}` : ""} · ${when}`,
    kicker: "Sign-in receipt",
    heading: "A new sign-in on your account.",
    paragraphs: [
      `${firstName}, this is a record of a successful sign-in to your ${brand} admin account. If it was you, no action is needed.`,
      `If it was not you, reset your password immediately. That ends every other active session on this account and blocks further sign-ins until a new password is set.`,
    ],
    infoRows: [
      { label: "When", value: when },
      { label: "Device", value: deviceLabel },
      ...(location ? [{ label: "Location", value: `${location} (approximate)` }] : []),
    ],
    cta: { label: "Reset password", url: helpUrl },
    finePrint:
      "Sign-in receipts are sent for every successful login and cannot be turned off. They are the audit trail for your own account.",
    brand,
  });
}
