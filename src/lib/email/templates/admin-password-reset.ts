import { renderEmailShell, type EmailShellOutput } from "./shell";

/** Admin password-reset email. Renders through the shared brand shell. */
export function renderAdminPasswordResetEmail({
  resetUrl,
  brand = "Kiribé",
  ttlMinutes,
}: {
  resetUrl: string;
  brand?: string;
  ttlMinutes: number;
}): EmailShellOutput {
  return renderEmailShell({
    subject: `Reset your ${brand} admin password`,
    preheader: `A one-time link to set a new password. Expires in ${ttlMinutes} minutes.`,
    kicker: "Password reset",
    heading: "Let's get you back in.",
    paragraphs: [
      `Someone — hopefully you — asked to reset the password on your ${brand} admin account. Use the button below to choose a new one and pick up where you left off.`,
      `The link is single-use, expires in ${ttlMinutes} minutes, and signs you out of every other device the moment your new password is set. Anything already open in another tab will be logged out too.`,
    ],
    cta: { label: "Reset password", url: resetUrl },
    finePrint:
      "Didn't ask for this? You can safely ignore this email — your current password stays exactly as it was. If resets you didn't request keep arriving, let us know so we can look into it.",
    brand,
  });
}
