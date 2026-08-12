import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Sent to a writer when an editor moves their article from in_review to
 * published (or scheduled). Tone stays close to a desk note: short, warm,
 * factual. The writer's byline is live on the site now.
 */
export function renderArticleApprovedEmail({
  writerName,
  articleTitle,
  articleUrl,
  editorName,
  scheduledFor,
  brand = "Kiribé",
}: {
  writerName?: string;
  articleTitle: string;
  articleUrl: string;
  editorName?: string;
  /** ISO 8601 timestamp. Set when the article is scheduled instead of live now. */
  scheduledFor?: string;
  brand?: string;
}): EmailShellOutput {
  const firstName = writerName?.trim().split(/\s+/)[0] ?? "there";
  const scheduled = scheduledFor
    ? new Date(scheduledFor).toUTCString()
    : undefined;
  const editorSentence = editorName ? ` Edited by ${editorName}.` : "";
  const kicker = scheduled ? "Scheduled" : "Now live";
  const heading = scheduled
    ? `"${articleTitle}" is scheduled.`
    : `"${articleTitle}" is now live on ${brand}.`;

  const paragraphs = scheduled
    ? [
        `${firstName}, the desk cleared "${articleTitle}" for publication.${editorSentence} It will go live at the time listed below and appear across the site automatically.`,
        `No further action is required. If you would like changes before it publishes, open the piece in the admin and file the edit.`,
      ]
    : [
        `${firstName}, "${articleTitle}" is now live on ${brand}.${editorSentence}`,
        `You can share the link freely. If anything needs correcting after publication, open the piece in the admin. That is the fastest route for a fix.`,
      ];

  return renderEmailShell({
    subject: scheduled
      ? `Scheduled: "${articleTitle}" (${brand})`
      : `Now live: "${articleTitle}" (${brand})`,
    preheader: scheduled
      ? `Cleared for publication. Goes live at the time listed below.`
      : `Cleared and published. Byline included.`,
    kicker,
    heading,
    paragraphs,
    infoRows: [
      { label: "Title", value: articleTitle },
      ...(scheduled ? [{ label: "Publishes", value: scheduled }] : []),
      ...(editorName ? [{ label: "Approved by", value: editorName }] : []),
    ],
    cta: {
      label: scheduled ? "Preview article" : "Read on the site",
      url: articleUrl,
    },
    finePrint:
      "You are receiving this because you are the byline on this article. These publication receipts cannot be turned off. They are the record of your work going out under your name.",
    brand,
  });
}
