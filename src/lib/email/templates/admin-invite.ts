/**
 * Admin team invite email. Inline styles only (most clients strip <style>).
 * Mirrors the subscribe-confirmation template's brand shell.
 */
export function renderAdminInviteEmail({
  acceptUrl,
  inviterName,
  role,
  brand = "Kiribé",
}: {
  acceptUrl: string;
  inviterName?: string;
  role?: string;
  brand?: string;
}): { subject: string; html: string; text: string } {
  const subject = `You've been invited to the ${brand} editorial team`;
  const invitedBy = inviterName ? `${inviterName} has invited you` : "You've been invited";
  const roleLine = role
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#4A5565;">Your role: <strong style="color:#1A1A1A;text-transform:capitalize;">${role}</strong>.</p>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#FAF8F5;font-family:'Open Sans',Arial,sans-serif;color:#1A1A1A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF8F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.06);">
            <tr>
              <td style="background:#710A0A;padding:32px 32px 24px;text-align:center;color:#ffffff;">
                <div style="font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:20px;letter-spacing:.04em;text-transform:uppercase;">${brand}</div>
                <div style="height:2px;width:48px;background:#C9A227;margin:12px auto 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:24px;line-height:32px;color:#101828;">Join the ${brand} team</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#4A5565;">${invitedBy} to contribute to ${brand}. Set your password to activate your account and get started.</p>
                ${roleLine}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                  <tr>
                    <td style="background:#710A0A;">
                      <a href="${acceptUrl}" style="display:inline-block;padding:14px 28px;font-family:'Outfit',Arial,sans-serif;font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Accept invite</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:20px;color:#99A1AF;">This link is single-use and expires in 7 days. If you weren't expecting this invite, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Join the ${brand} team\n\n${invitedBy} to contribute to ${brand}.${role ? ` Your role: ${role}.` : ""}\n\nAccept your invite and set your password:\n${acceptUrl}\n\nThis link is single-use and expires in 7 days. If you weren't expecting this invite, ignore this email.`;

  return { subject, html, text };
}
