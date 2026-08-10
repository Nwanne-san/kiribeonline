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
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
  ink: "#1a1a1a",
  inkSecondary: "#4b5563",
  muted: "#6b7280",
  border: "#e5e7eb",
} as const;

const FONT_HEADLINE = "'Outfit',Georgia,'Times New Roman',serif";
const FONT_BODY = "'Open Sans',Helvetica,Arial,sans-serif";

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
    ? `<div style="margin-top:6px;font-family:${FONT_BODY};font-size:11px;line-height:16px;color:${BRAND.muted};">${escapeHtml(input.footerNote)}</div>`
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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background:${BRAND.surface};border-radius:8px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.06);">
            <tr>
              <td style="background:${BRAND.burgundy};padding:36px 32px 28px;text-align:center;color:${BRAND.surface};">
                <div style="font-family:${FONT_HEADLINE};font-weight:700;font-size:22px;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(brand)}</div>
                <div style="height:2px;width:56px;background:${BRAND.mustard};margin:14px auto 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 32px;">
                ${kicker}
                <h1 style="margin:0 0 18px;font-family:${FONT_HEADLINE};font-weight:600;font-size:26px;line-height:34px;color:${BRAND.ink};">${escapeHtml(input.heading)}</h1>
                ${paragraphs}
                ${infoRows}
                ${cta}
                ${finePrint}
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.burgundyDark};padding:20px 32px;text-align:center;font-family:${FONT_BODY};font-size:12px;line-height:18px;color:rgba(255,255,255,.72);">
                <div style="font-family:${FONT_HEADLINE};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${BRAND.mustard};">${escapeHtml(brand)}</div>
                <div style="margin-top:4px;">&copy; ${year} ${escapeHtml(brand)}. Editorial on film, television, and culture.</div>
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
  textLines.push(`— ${brand}`);
  if (input.footerNote) textLines.push(input.footerNote);

  return {
    subject: input.subject,
    html,
    text: textLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
  };
}
