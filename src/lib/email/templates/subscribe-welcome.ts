/**
 * Plain HTML welcome email sent when a subscriber is auto-confirmed.
 * Inline styles only (most email clients strip <style> blocks).
 */
export function renderSubscribeWelcomeEmail({
  brand = "Kiribé",
  siteUrl = "https://kiribeonline.com",
}: {
  brand?: string;
  siteUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to the ${brand} newsletter — you're in!`;

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
                  You're in the story.
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4B5563;">
                  Welcome to the ${brand} inner circle. You'll receive curated editorial on film, television,
                  and culture — delivered straight to your inbox. No noise, only what matters.
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4B5563;">
                  While you wait for the next issue, explore our latest stories below.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="background:#C9A227;border-radius:6px;">
                      <a href="${siteUrl}" style="display:inline-block;padding:14px 28px;font-family:'Outfit',Arial,sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#7F0400;text-decoration:none;">
                        Read the latest
                      </a>
                    </td>
                  </tr>
                </table>
                <hr style="border:0;border-top:1px solid #E5E7EB;margin:32px 0;" />
                <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
                  You&rsquo;re receiving this because you subscribed at ${siteUrl}.
                  You can unsubscribe at any time by replying to this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#F9FAFB;padding:20px 32px;text-align:center;font-size:12px;color:#6B7280;">
                &copy; ${new Date().getFullYear()} ${brand}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Welcome to ${brand}!\n\nYou're subscribed to the ${brand} newsletter. You'll receive curated editorial on film, television, and culture — delivered straight to your inbox.\n\nRead the latest stories: ${siteUrl}\n\nYou're receiving this because you subscribed at ${siteUrl}.`;

  return { subject, html, text };
}
