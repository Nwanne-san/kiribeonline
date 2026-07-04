/**
 * Plain HTML confirmation email. Inline styles only (most clients strip <style>).
 */
export function renderSubscribeConfirmationEmail({
  confirmUrl,
  brand = "Kiribé",
}: {
  confirmUrl: string;
  brand?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Confirm your ${brand} newsletter subscription`;

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
                <h1 style="margin:0 0 12px;font-family:'Outfit',Arial,sans-serif;font-size:24px;font-weight:700;color:#1A1A1A;line-height:1.2;">
                  Confirm your subscription
                </h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4B5563;">
                  Thanks for subscribing to the ${brand} newsletter — thoughtful editorial
                  on film, television, and culture. Tap the button below to confirm and
                  we&rsquo;ll start sending you our latest stories.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:#C9A227;border-radius:6px;">
                      <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#7F0400;text-decoration:none;">
                        Confirm subscription
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;color:#6B7280;line-height:1.5;">
                  Button not working? Paste this URL into your browser:
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
                  <a href="${confirmUrl}" style="color:#6B1D2A;">${confirmUrl}</a>
                </p>
                <hr style="border:0;border-top:1px solid #E5E7EB;margin:32px 0;" />
                <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                  If you didn&rsquo;t request this, just ignore this email — you won&rsquo;t
                  receive any further messages from us.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#F9FAFB;padding:20px 32px;text-align:center;font-size:12px;color:#6B7280;">
                © ${new Date().getFullYear()} ${brand}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Confirm your ${brand} subscription\n\nThanks for subscribing. Confirm with this link:\n${confirmUrl}\n\nIf you didn't request this, ignore this email.`;

  return { subject, html, text };
}
