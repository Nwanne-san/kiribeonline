/**
 * Shared brand shell for every Kiribé transactional email. Callers hand in
 * copy + optional CTA + optional fine-print/footer; this file owns the layout,
 * palette and typography so every mail stays visually identical.
 *
 * Inline styles only — Gmail, Outlook and most webmail clients strip
 * `<style>` blocks. Layout uses nested `<table>`s because that is still the
 * only way to render consistently across Outlook desktop (which uses Word to
 * render HTML) and mobile clients that ignore modern CSS.
 *
 * Brand tokens are duplicated here as literals (rather than imported from
 * `src/theme/tailwind.css`) because emails are stringified server-side and
 * never load the site stylesheet. Keep in sync with the tokens in
 * `--color-burgundy`, `--color-mustard`, `--color-cream`.
 */

const BRAND = {
  burgundy: "#6b1d2a",
  burgundyDark: "#4a1420",
  mustard: "#c9a227",
  mustardContrast: "#1a1a1a",
  cream: "#faf8f5",
  creamDeep: "#f4efe4",
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
  ink: "#1a1a1a",
  inkSecondary: "#4b5563",
  muted: "#6b7280",
  border: "#e5e7eb",
} as const;

const FONT_HEADLINE = "'Outfit',Georgia,'Times New Roman',serif";
const FONT_BODY = "'Open Sans',Helvetica,Arial,sans-serif";

const BRAND_TAGLINE = "Editorial on film, television, and culture.";
const SITE_URL = "https://kiribeonline.com";
const CONTACT_URL = "https://kiribeonline.com/contact";

/**
 * Subtle watermark — a mustard "K" set inside a hairline rule, repeated at
 * very low opacity across the body surface. Encoded as an SVG data URI so it
 * renders in every client that supports HTML email backgrounds (Gmail, Apple
 * Mail, iOS Mail, Yahoo, Outlook web). Clients that ignore backgrounds
 * (Outlook desktop's Word renderer) fall back to the base cream tint — the
 * shell doesn't rely on the mark being visible, only on it being tasteful
 * when it does render.
 */
const WATERMARK_SVG_DATA_URI = (() => {
  const raw = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>` +
    `<g fill='none' stroke='#c9a227' stroke-opacity='0.08'>` +
    `<circle cx='130' cy='130' r='96' stroke-width='1.2'/>` +
    `<circle cx='130' cy='130' r='72' stroke-width='0.9'/>` +
    `</g>` +
    `<text x='130' y='158' text-anchor='middle' font-family='Outfit, Georgia, serif' font-size='108' font-weight='700' fill='#6b1d2a' fill-opacity='0.045' letter-spacing='6'>K</text>` +
    `</svg>`;
  // Percent-encode the reserved characters that break inline data URIs.
  // btoa isn't available in every Node runtime we target, so hand-roll it.
  const encoded = raw
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/"/g, "%22")
    .replace(/\n/g, "%0A");
  return `data:image/svg+xml;utf8,${encoded}`;
})();

export type EmailCta = {
  label: string;
  url: string;
  /** Optional secondary link rendered as a small text link under the button. */
  secondary?: { label: string; url: string };
};

export type EmailInfoRow = {
  label: string;
  value: string;
};

export type EmailShellInput = {
  /** Subject line — returned back verbatim so callers store one string. */
  subject: string;
  /** Preview text shown in inbox list rows. Kept short — most clients truncate at ~90 chars. */
  preheader?: string;
  /** Big heading over the body. Keep to one short line. */
  heading: string;
  /** Optional small kicker rendered above the heading (e.g. "Password reset", "Team invite"). */
  kicker?: string;
  /** Body paragraphs. Each string is one <p>. Plain text — no HTML. */
  paragraphs: string[];
  /** Optional definition-list style rows rendered before the CTA. */
  infoRows?: EmailInfoRow[];
  /** Primary call-to-action button. */
  cta?: EmailCta;
  /** Optional fine-print rendered under the CTA (e.g. TTL, security note). */
  finePrint?: string;
  /** Optional plain-text closer shown in the footer strip (e.g. unsubscribe note). */
  footerNote?: string;
  brand?: string;
};

export type EmailShellOutput = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInfoRows(rows: EmailInfoRow[]): string {
  const inner = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 14px;background:${BRAND.surfaceAlt};border-top:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};width:35%;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;background:${BRAND.surface};border-top:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:14px;line-height:20px;color:${BRAND.ink};vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join("");
  return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 24px;border:1px solid ${BRAND.border};border-radius:6px;border-collapse:separate;overflow:hidden;">
          ${inner}
        </table>`;
}

function renderCta(cta: EmailCta): string {
  const secondary = cta.secondary
    ? `
        <p style="margin:14px 0 0;font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${BRAND.muted};">
          <a href="${cta.secondary.url}" style="color:${BRAND.burgundy};text-decoration:underline;">${escapeHtml(cta.secondary.label)}</a>
        </p>`
    : "";
  return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
          <tr>
            <td style="background:${BRAND.mustard};border-radius:4px;">
              <a href="${cta.url}" style="display:inline-block;padding:14px 32px;font-family:${FONT_HEADLINE};font-weight:600;font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.mustardContrast};text-decoration:none;">${escapeHtml(cta.label)}</a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:18px;color:${BRAND.muted};">
          Button not working? Copy and paste this URL into your browser:<br />
          <a href="${cta.url}" style="color:${BRAND.burgundy};text-decoration:underline;word-break:break-all;">${cta.url}</a>
        </p>${secondary}`;
}

/**
 * Render a full transactional email. Returns the same `{subject,html,text}`
 * shape every existing template exposes, so `sendTransactionalEmail` needs no
 * changes.
 */
export function renderEmailShell(input: EmailShellInput): EmailShellOutput {
  const brand = input.brand ?? "Kiribé";
  const year = new Date().getFullYear();
  const kicker = input.kicker
    ? `<p style="margin:0 0 10px;font-family:${FONT_HEADLINE};font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${BRAND.burgundy};">${escapeHtml(input.kicker)}</p>`
    : "";
  const paragraphs = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:15px;line-height:24px;color:${BRAND.inkSecondary};">${escapeHtml(p)}</p>`
    )
    .join("");
  const infoRows = input.infoRows?.length ? renderInfoRows(input.infoRows) : "";
  const cta = input.cta ? renderCta(input.cta) : "";
  const finePrint = input.finePrint
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${BRAND.border};font-family:${FONT_BODY};font-size:12px;line-height:18px;color:${BRAND.muted};">${escapeHtml(input.finePrint)}</p>`
    : "";
  const footerNote = input.footerNote
    ? `<div style="margin-top:8px;font-family:${FONT_BODY};font-size:11px;line-height:16px;color:rgba(255,255,255,0.6);">${escapeHtml(input.footerNote)}</div>`
    : "";
  const preheader = input.preheader
    ? `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;font-size:1px;">${escapeHtml(input.preheader)}</div>`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.cream};font-family:${FONT_BODY};color:${BRAND.ink};">
    ${preheader}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.cream};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:${BRAND.surface};border-radius:10px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 20px rgba(0,0,0,.08);">
            <!-- Editorial banner: brand mark, gold rule, tagline, sub-hairline -->
            <tr>
              <td style="background:${BRAND.burgundy};padding:40px 32px 28px;text-align:center;color:${BRAND.surface};background-image:linear-gradient(180deg, ${BRAND.burgundy} 0%, ${BRAND.burgundy} 78%, ${BRAND.burgundyDark} 100%);">
                <div style="font-family:${FONT_HEADLINE};font-weight:700;font-size:24px;letter-spacing:.22em;text-transform:uppercase;line-height:1;">${escapeHtml(brand)}</div>
                <div style="height:2px;width:64px;background:${BRAND.mustard};margin:14px auto 12px;"></div>
                <div style="font-family:${FONT_HEADLINE};font-weight:400;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,0.78);">${escapeHtml(BRAND_TAGLINE)}</div>
              </td>
            </tr>
            <!-- Thin mustard hairline underscoring the masthead -->
            <tr><td style="height:3px;background:${BRAND.mustard};line-height:3px;font-size:0;">&nbsp;</td></tr>
            <!-- Body — subtle KIRIBÉ watermark tiled at low opacity behind the copy -->
            <tr>
              <td style="padding:40px 36px 32px;background-color:${BRAND.surface};background-image:url('${WATERMARK_SVG_DATA_URI}');background-repeat:repeat;background-position:center top;">
                ${kicker}
                <h1 style="margin:0 0 18px;font-family:${FONT_HEADLINE};font-weight:600;font-size:26px;line-height:34px;color:${BRAND.ink};">${escapeHtml(input.heading)}</h1>
                ${paragraphs}
                ${infoRows}
                ${cta}
                ${finePrint}
              </td>
            </tr>
            <!-- Footer — editorial mark, tagline, contact + site links, © line -->
            <tr>
              <td style="background:${BRAND.burgundyDark};padding:26px 32px 22px;text-align:center;color:rgba(255,255,255,0.78);font-family:${FONT_BODY};">
                <div style="font-family:${FONT_HEADLINE};font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:${BRAND.mustard};">${escapeHtml(brand)}</div>
                <div style="height:1px;width:36px;background:rgba(201,162,39,0.5);margin:10px auto 12px;"></div>
                <div style="font-family:${FONT_HEADLINE};font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,0.82);">${escapeHtml(BRAND_TAGLINE)}</div>
                <div style="margin-top:14px;font-size:12px;line-height:18px;">
                  <a href="${SITE_URL}" style="color:${BRAND.mustard};text-decoration:none;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">Read on the site</a>
                  <span style="color:rgba(255,255,255,0.35);padding:0 8px;">·</span>
                  <a href="${CONTACT_URL}" style="color:${BRAND.mustard};text-decoration:none;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">Reach the desk</a>
                </div>
                <div style="margin-top:16px;font-size:11px;line-height:16px;color:rgba(255,255,255,0.55);">
                  &copy; ${year} ${escapeHtml(brand)}. Sent from our editorial desk.
                </div>
                ${footerNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines: string[] = [];
  if (input.kicker) textLines.push(input.kicker.toUpperCase(), "");
  textLines.push(input.heading, "");
  for (const p of input.paragraphs) textLines.push(p, "");
  if (input.infoRows?.length) {
    for (const row of input.infoRows) textLines.push(`${row.label}: ${row.value}`);
    textLines.push("");
  }
  if (input.cta) {
    textLines.push(`${input.cta.label}: ${input.cta.url}`, "");
    if (input.cta.secondary) {
      textLines.push(`${input.cta.secondary.label}: ${input.cta.secondary.url}`, "");
    }
  }
  if (input.finePrint) textLines.push(input.finePrint, "");
  textLines.push(`Sent by ${brand}.`);
  textLines.push(BRAND_TAGLINE);
  textLines.push(SITE_URL);
  if (input.footerNote) textLines.push(input.footerNote);

  return {
    subject: input.subject,
    html,
    text: textLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
  };
}
