import { APP_URL, getResendClient, RESEND_FROM_EMAIL } from "@/lib/email/resend";
import { renderAdminPasswordResetEmail } from "@/lib/email/templates/admin-password-reset";
import { AdminRoutes } from "@/routes/admin.routes";
import { RESET_TOKEN_TTL_MS } from "./reset-token";

function buildResetUrl(token: string): string {
  return `${APP_URL}${AdminRoutes.resetPassword}?token=${encodeURIComponent(token)}`;
}

/**
 * Email the single-use reset link. Returns `false` when Resend isn't configured
 * (dev) — the caller stays generic to the requester either way, but in dev the
 * raw URL is logged so a developer can complete the flow locally. The raw token
 * itself is never persisted.
 */
export async function sendAdminPasswordResetEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}): Promise<boolean> {
  const resetUrl = buildResetUrl(token);
  const resend = getResendClient();
  if (!resend) {
    // Dev fallback: log the URL, not the raw token separately. This is the
    // ONLY path where the URL appears anywhere but the mail transport.
    console.warn(
      `[users] RESEND_API_KEY not set — password reset email skipped.\n  reset URL (dev only): ${resetUrl}`
    );
    return false;
  }

  const { subject, html, text } = renderAdminPasswordResetEmail({
    resetUrl,
    ttlMinutes: Math.round(RESET_TOKEN_TTL_MS / 60_000),
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
    console.error("[users] password reset email failed", err);
    return false;
  }
}
