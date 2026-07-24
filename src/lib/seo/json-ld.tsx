import { getSiteBaseUrl, toAbsoluteUrl } from "./site-url";

/**
 * JSON-LD structured data helpers + a `<JsonLd>` component that renders a
 * `<script type="application/ld+json">` tag with HTML-safe serialization.
 *
 * Keep the schema shapes narrow — Google, Bing, and the other schema.org
 * consumers ignore unknown fields, but sending drift means we can't lean on
 * "if it's here, it's used." Every field emitted here has a rich-results
 * consumer that reads it.
 */

const SITE_NAME = "Kiribé Online";
const PUBLISHER_LOGO_PATH = "/icon.svg";

type OrgSchema = Record<string, unknown>;

/**
 * Escape `</` in the serialized JSON so the JSON payload can't accidentally
 * close the enclosing `<script>` tag. The rest of JSON is already safe in
 * an HTML `<script>` context.
 */
function safeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/** Site-wide Organization node — used in the root JSON-LD graph. */
export function orgSchema(): OrgSchema {
  const url = getSiteBaseUrl();
  return {
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: SITE_NAME,
    url,
    logo: toAbsoluteUrl(PUBLISHER_LOGO_PATH),
  };
}

/** Site-wide WebSite node — attaches a sitelinks searchbox for Google. */
export function websiteSchema(): OrgSchema {
  const url = getSiteBaseUrl();
  return {
    "@type": "WebSite",
    "@id": `${url}#website`,
    url,
    name: SITE_NAME,
    publisher: { "@id": `${url}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Root graph — embed once in the root layout so every page inherits it. */
export function siteGraph(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [orgSchema(), websiteSchema()],
  };
}

export type BreadcrumbItem = { name: string; url: string };

/**
 * BreadcrumbList schema. Each item's URL is absolute. `position` is
 * 1-indexed per schema.org.
 */
export function breadcrumbListSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  };
}

export type NewsArticleInput = {
  /** Canonical article URL (relative or absolute). */
  url: string;
  headline: string;
  description?: string;
  /** Primary hero image (or OG image) URL, relative or absolute. */
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  /** Slugs / names — powers the `articleSection` field for Google news. */
  section?: string;
  keywords?: string[];
};

/**
 * NewsArticle schema — the shape Google Rich Results reads for headline
 * cards, in-Discover previews, and Search publisher-carousels.
 */
export function newsArticleSchema(input: NewsArticleInput): Record<string, unknown> {
  const url = toAbsoluteUrl(input.url);
  const image = input.imageUrl ? toAbsoluteUrl(input.imageUrl) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.headline,
    description: input.description,
    image: image ? [image] : undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(PUBLISHER_LOGO_PATH),
      },
    },
    articleSection: input.section,
    keywords: input.keywords?.length ? input.keywords.join(", ") : undefined,
  };
}

export type CollectionPageInput = {
  name: string;
  description?: string;
  /** Canonical page URL, relative or absolute. */
  url: string;
};

/**
 * CollectionPage schema — used on archive-style pages (category, tag,
 * videos, spotlight, articles index). Signals to search that this is a
 * curated list, not the underlying items.
 */
export function collectionPageSchema(input: CollectionPageInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: toAbsoluteUrl(input.url),
    isPartOf: { "@id": `${getSiteBaseUrl()}#website` },
  };
}

/**
 * A React component that renders `<script type="application/ld+json">`.
 * Accepts a single payload object; for a graph, pass `siteGraph()` or a
 * hand-authored `{ "@context": "https://schema.org", "@graph": [...] }`.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Safe because `safeJsonLd` escapes the script-close sequence and the
      // rest of JSON is already legal inside a <script> tag.
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
