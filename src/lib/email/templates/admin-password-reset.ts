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
    heading: "Let us get you back in.",
    paragraphs: [
      `Someone (hopefully you) asked to reset the password on your ${brand} admin account. Use the button below to choose a new one and pick up where you left off.`,
      `The link is single-use and expires in ${ttlMinutes} minutes. The moment your new password is set, every other signed-in device is logged out, including any tab still open in the background.`,
    ],
    cta: { label: "Reset password", url: resetUrl },
    finePrint:
      "Did not ask for this? You can safely ignore this email. Your current password stays exactly as it was. If resets you did not request keep arriving, let the desk know so we can look into it.",
    brand,
  });
}
