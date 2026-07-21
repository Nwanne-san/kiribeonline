/**
 * Admin password-reset email. Inline styles only (most clients strip <style>).
 * Mirrors the invite template's brand shell.
 */
export function renderAdminPasswordResetEmail({
  resetUrl,
  brand = "Kiribé",
  ttlMinutes,
}: {
  resetUrl: string;
  brand?: string;
  ttlMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `Reset your ${brand} admin password`;

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
                <h1 style="margin:0 0 16px;font-family:'Outfit',Arial,sans-serif;font-weight:400;font-size:24px;line-height:32px;color:#101828;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#4A5565;">Someone — hopefully you — asked to reset the password on your ${brand} admin account. Click the button below to choose a new password. The link is single-use and expires in ${ttlMinutes} minutes.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                  <tr>
                    <td style="background:#710A0A;">
                      <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-family:'Outfit',Arial,sans-serif;font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Reset password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:20px;color:#99A1AF;">If you didn't request this reset, you can safely ignore this email — your password will stay the same.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Reset your ${brand} password\n\nSomeone — hopefully you — asked to reset the password on your ${brand} admin account. Follow this link to choose a new one:\n${resetUrl}\n\nThis link is single-use and expires in ${ttlMinutes} minutes. If you didn't request this reset, ignore this email.`;

  return { subject, html, text };
}
