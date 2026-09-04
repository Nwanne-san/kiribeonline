import { renderEmailShell, type EmailShellOutput } from "./shell";

export type NewArticleEmailInput = {
  articleTitle: string;
  articleSlug: string;
  articleExcerpt?: string | null;
  articleUrl: string;
  categoryName?: string | null;
  brand?: string;
};

/**
 * Subscriber notification email dispatched when a new article is published.
 * Rendered through the shared brand shell with Kiribé typography and styling.
 */
export function renderNewArticlePublishedEmail({
  articleTitle,
  articleExcerpt,
  articleUrl,
  categoryName,
  brand = "Kiribé",
}: NewArticleEmailInput): EmailShellOutput {
  const kicker = categoryName ? `New in ${categoryName}` : "New Editorial";
  const excerptParagraph = articleExcerpt?.trim()
    ? articleExcerpt.trim()
    : "A new story has just been published on Kiribé Online.";

  return renderEmailShell({
    subject: `New on ${brand}: ${articleTitle}`,
    preheader: articleExcerpt?.trim() || `${articleTitle} is now live on ${brand}.`,
    kicker,
    heading: articleTitle,
    paragraphs: [
      excerptParagraph,
      `Our latest editorial piece is now live. Read the full story on the site.`,
    ],
    cta: {
      label: "Read Full Story",
      url: articleUrl,
    },
    finePrint:
      "You received this dispatch because you are a confirmed subscriber to Kiribé Online.",
    footerNote: `Sent to our subscribers from the ${brand} editorial desk.`,
    brand,
  });
}
