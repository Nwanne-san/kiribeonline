import { APP_URL, sendTransactionalEmail } from "@/lib/email/resend";
import { renderPasswordChangedEmail } from "@/lib/email/templates/password-changed";
import { AdminRoutes } from "@/routes/admin.routes";

/**
 * Post-reset security receipt. Called fire-and-forget from
 * `completePasswordReset`; failure is logged, never surfaced — the reset
 * itself already succeeded and we do not want to block that response on the
 * mail transport. Returns `false` when Resend isn't configured (dev) or the
 * send failed.
 */
export async function sendAdminPasswordChangedEmail({
  email,
  changedAtISO,
  ipAddress,
}: {
  email: string;
  changedAtISO: string;
  ipAddress?: string;
}): Promise<boolean> {
  const { subject, html, text } = renderPasswordChangedEmail({
    loginUrl: `${APP_URL}${AdminRoutes.login}`,
    changedAtISO,
    ipAddress,
  });

  return sendTransactionalEmail({
    to: email,
    subject,
    html,
    text,
    context: "[users] password changed",
  });
}
