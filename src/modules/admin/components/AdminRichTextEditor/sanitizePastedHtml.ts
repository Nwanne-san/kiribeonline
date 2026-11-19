/**
 * Normalize HTML pasted from rich sources (Google Docs, Word / Word Online,
 * Notion, Apple Notes, Pages, generic web pages) so Lexical's DOM importer
 * picks up bold / italic / underline / lists / headings instead of flattening
 * to plain text.
 *
 * Why this exists: Lexical's default importer keys off *tag names*
 * (<strong>, <em>, <u>), but most office-suite exporters use *inline styles*
 * on <span> (font-weight:700, font-style:italic, text-decoration:underline)
 * and let the browser render them visually. The result is a paste that
 * *looks* formatted in the clipboard preview but lands as plain text in
 * the editor. We rewrite those style hints back into semantic tags, and
 * drop per-exporter wrapper noise that otherwise shows up as empty blocks.
 *
 * Handled quirks:
 *  - Google Docs: outer <b style="font-weight:normal"> wrapper that defeats
 *    bold detection; `<span id="docs-internal-guid-…">` wrapper.
 *  - Microsoft Word / Word Online: `<o:p>` namespaced tags, `mso-*` styles,
 *    `<!--StartFragment-->` / `<!--EndFragment-->` markers, class="MsoNormal".
 *  - Notion: style-only <span>s on every run; empty <br> rows between blocks.
 *  - Generic: <meta>/<style>/<script>/<link> noise, inline-styled <span>s,
 *    classes/ids we don't care about.
 */
export function sanitizePastedHtml(rawHtml: string): string {
  if (typeof window === "undefined") return rawHtml;

  // Strip Word's conditional comments and fragment markers up front — they
  // don't survive DOMParser cleanly, and they can wrap the useful content.
  const preCleaned = rawHtml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<\/?o:[^>]+>/gi, "");

  const parser = new DOMParser();
  const doc = parser.parseFromString(preCleaned, "text/html");

  // Drop <meta>/<style>/<script>/<link> — noise, and inline <style> can leak
  // CSS classes that collide with the editor's own.
  doc.querySelectorAll("meta, style, script, link, title").forEach((n) => n.remove());

  // Drop Word's `<o:…>`, `<w:…>`, `<v:…>` holdouts if DOMParser kept any.
  doc.querySelectorAll("*").forEach((el) => {
    if (/^(o|w|v|m):/i.test(el.tagName)) el.remove();
  });

  // Unwrap the Google Docs `<b style="font-weight:normal">` fragment root.
  // It's the single biggest source of bold loss when pasting from Docs.
  doc.querySelectorAll("b").forEach((el) => {
    const weight = (el.getAttribute("style") ?? "").match(
      /font-weight\s*:\s*([^;]+)/i,
    )?.[1];
    if (weight && /normal|400/i.test(weight)) unwrap(el);
  });

  // Unwrap Docs' `<span id="docs-internal-guid-…">` — purely structural.
  doc
    .querySelectorAll('span[id^="docs-internal-guid-"]')
    .forEach((el) => unwrap(el));

  // Rewrite inline-styled spans into semantic tags the importer handles.
  // Static snapshot — unwrap() mutates the tree as we go.
  Array.from(doc.querySelectorAll("span")).forEach((span) => {
    const style = span.getAttribute("style") ?? "";
    if (!style) {
      // Spans with no style add nothing semantic — flatten.
      unwrap(span);
      return;
    }
    const weight = style.match(/font-weight\s*:\s*([^;]+)/i)?.[1]?.trim();
    const italic = /font-style\s*:\s*italic/i.test(style);
    const underline = /text-decoration[^;]*underline/i.test(style);
    const lineThrough = /text-decoration[^;]*line-through/i.test(style);

    const isBold = weight ? /^(bold|[6-9]00)$/i.test(weight) : false;
    const hasFormatting = isBold || italic || underline || lineThrough;
    if (!hasFormatting) {
      unwrap(span);
      return;
    }

    // Wrap children in innermost-first order so we end up with
    // <strong><em><u>text</u></em></strong>.
    const inner = doc.createDocumentFragment();
    while (span.firstChild) inner.appendChild(span.firstChild);

    let wrapped: Node = inner;
    if (lineThrough) wrapped = wrapWith(doc, wrapped, "s");
    if (underline) wrapped = wrapWith(doc, wrapped, "u");
    if (italic) wrapped = wrapWith(doc, wrapped, "em");
    if (isBold) wrapped = wrapWith(doc, wrapped, "strong");

    span.replaceWith(wrapped);
  });

  // Normalize Word's "MsoNormal" paragraphs to plain <p> so the importer
  // treats them as paragraphs rather than styled containers.
  doc.querySelectorAll("p.MsoNormal, p[class^='Mso']").forEach((p) => {
    p.removeAttribute("class");
    p.removeAttribute("style");
  });

  // Strip all images — we don't auto-upload pasted images yet, and the raw
  // source URLs (googleusercontent, file://, data:…) either 403 or won't
  // round-trip to our R2 bucket. The caller shows a toast nudging the
  // operator to re-insert via the media picker.
  doc.querySelectorAll("img").forEach((img) => img.remove());

  return doc.body.innerHTML;
}

/** Does the raw HTML contain at least one <img>? Caller uses this to toast. */
export function pastedHtmlContainsImages(rawHtml: string): boolean {
  return /<img\s[^>]*src=/i.test(rawHtml);
}

function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function wrapWith(doc: Document, node: Node, tag: string): Element {
  const wrapper = doc.createElement(tag);
  wrapper.appendChild(node);
  return wrapper;
}
