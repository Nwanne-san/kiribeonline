/**
 * Public byline resolution.
 *
 * Writers, editors, and contributors can publish without their name attached
 * (`article.hideByline`). That opt-out is a *display* rule only — the `author`
 * relationship stays populated so the admin module, author stats, and version
 * history always attribute the piece correctly.
 *
 * An opted-out piece is still Kiribé's editorial work, so it reads
 * “Kiribé Editor”, never “Anonymous”. The same fallback covers articles that
 * genuinely have no author set (legacy imports, deleted user), so no public
 * surface ever renders a blank or "undefined" byline.
 */

export const KIRIBE_EDITOR_BYLINE = "Kiribé Editor";

type BylineSource = {
  author?: { id?: string | number; name?: string | null } | string | null;
  hideByline?: boolean | null;
};

/**
 * The name to print on public surfaces (cards, article header, OG metadata,
 * RSS, JSON-LD). Never returns an empty string.
 *
 * Note the bare-string case: at `depth: 0` Payload returns the author as an id
 * string with no name to show, which is treated the same as "no author".
 */
export function resolvePublicByline(source: BylineSource | null | undefined): string {
  if (!source || source.hideByline) return KIRIBE_EDITOR_BYLINE;

  const { author } = source;
  if (!author || typeof author === "string") return KIRIBE_EDITOR_BYLINE;

  const name = author.name?.trim();
  return name ? name : KIRIBE_EDITOR_BYLINE;
}

/**
 * True when the byline points at a real, named person — i.e. the public name
 * may be linked to an author page or used as a structured-data `Person`.
 * Anonymised and unattributed pieces return false so callers fall back to the
 * organisation as the author.
 */
export function hasNamedAuthor(source: BylineSource | null | undefined): boolean {
  if (!source || source.hideByline) return false;
  const { author } = source;
  return Boolean(author && typeof author !== "string" && author.name?.trim());
}
