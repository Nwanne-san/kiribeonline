import { APP_URL, getResendClient, RESEND_FROM_EMAIL } from "@/lib/email/resend";
import { renderAdminInviteEmail } from "@/lib/email/templates/admin-invite";
import { AdminRoutes } from "@/routes/admin.routes";

function buildAcceptUrl(token: string): string {
  return `${APP_URL}${AdminRoutes.acceptInvite}?token=${encodeURIComponent(token)}`;
}

/**
 * Email the single-use invite link. Returns `false` when Resend isn't configured
 * (dev) or delivery fails, so the caller can fall back to handing the raw token
 * to the inviting admin. The raw token is never logged.
 */
export async function sendAdminInviteEmail({
  email,
  token,
  role,
  invitedByName,
}: {
  email: string;
  token: string;
  role?: string;
  invitedByName?: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[users] RESEND_API_KEY not set — invite email skipped; raw token returned to the inviting admin."
    );
    return false;
  }

  const { subject, html, text } = renderAdminInviteEmail({
    acceptUrl: buildAcceptUrl(token),
    inviterName: invitedByName,
    role,
  });

  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error("[users] invite email failed", err);
    return false;
  }
}
