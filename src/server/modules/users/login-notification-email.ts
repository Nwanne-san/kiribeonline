import { APP_URL, sendTransactionalEmail } from "@/lib/email/resend";
import { renderAdminLoginNotificationEmail } from "@/lib/email/templates/admin-login-notification";
import { AdminRoutes } from "@/routes/admin.routes";

/**
 * Fire-and-forget sign-in receipt. Kept separate from `reset-email.ts` so it
 * doesn't accidentally block the login response — the caller never awaits.
 * Delivery failures are logged and never surfaced (a login must not fail
 * because the mail transport is unavailable).
 */
export async function sendAdminLoginNotificationEmail({
  email,
  recipientName,
  signedInAtISO,
  device,
  location,
}: {
  email: string;
  recipientName?: string | null;
  signedInAtISO: string;
  device: { browser: string; os: string };
  location: string | null;
}): Promise<boolean> {
  const helpUrl = `${APP_URL}${AdminRoutes.forgotPassword}`;
  const { subject, html, text } = renderAdminLoginNotificationEmail({
    recipientName,
    signedInAtISO,
    device,
    location,
    helpUrl,
  });
  return sendTransactionalEmail({
    to: email,
    subject,
    html,
    text,
    context: "[users] login notification",
  });
}
