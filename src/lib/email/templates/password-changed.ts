import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Post-reset security receipt. Sent after `completePasswordReset` succeeds so
 * the account holder always has a record of the change and a fast path to
 * flag it if it was not them.
 */
export function renderPasswordChangedEmail({
  loginUrl,
  changedAtISO,
  ipAddress,
  brand = "Kiribé",
}: {
  loginUrl: string;
  changedAtISO: string;
  ipAddress?: string;
  brand?: string;
}): EmailShellOutput {
  const changedAt = new Date(changedAtISO).toUTCString();

  return renderEmailShell({
    subject: `Your ${brand} password was just changed`,
    preheader: `A quick receipt so you know the change went through. No action needed if it was you.`,
    kicker: "Security notice",
    heading: "Your password was updated.",
    paragraphs: [
      `This is a quick note to confirm that the password on your ${brand} admin account was changed. Every other signed-in session has been logged out, so the only device with access is the one you just used.`,
      `If this was you, no further action is needed. You can sign in with the new password whenever you are ready.`,
    ],
    infoRows: [
      { label: "Changed at", value: changedAt },
      ...(ipAddress ? [{ label: "Request IP", value: ipAddress }] : []),
    ],
    cta: { label: "Return to sign-in", url: loginUrl },
    finePrint:
      "Did not do this? Reset your password immediately from the sign-in screen and let the desk know so we can look into it. Your account may have been compromised elsewhere.",
    brand,
  });
}
