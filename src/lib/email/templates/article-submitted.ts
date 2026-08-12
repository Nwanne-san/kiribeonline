import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Sent to admins when a writer moves a piece into the review queue. Tone is a
 * short desk note: what landed, who filed it, one link. No sales copy. This
 * is a working message the reader may see several times a day.
 * See DECISIONS.md (review-queue notifications).
 */
export function renderArticleSubmittedEmail({
  articleTitle,
  writerName,
  writerEmail,
  articleUrl,
  submittedAtISO,
  brand = "Kiribé",
}: {
  articleTitle: string;
  writerName?: string | null;
  writerEmail?: string | null;
  articleUrl: string;
  /** ISO 8601 timestamp of the transition into `in_review`. */
  submittedAtISO?: string;
  brand?: string;
}): EmailShellOutput {
  const byline = writerName?.trim() || writerEmail || "an unattributed writer";
  const submitted = submittedAtISO
    ? new Date(submittedAtISO).toUTCString()
    : undefined;

  return renderEmailShell({
    subject: `Review queue: "${articleTitle}"`,
    preheader: `Filed by ${byline}. Awaiting your read.`,
    kicker: "Review queue",
    heading: `"${articleTitle}" is with you.`,
    paragraphs: [
      `A new draft is in the review queue. Open it in the admin to read, edit, publish, or schedule. You can also send it back to the writer with a note.`,
      `This landed a moment ago. There is no formal turnaround. Take the time the piece needs.`,
    ],
    infoRows: [
      { label: "Title", value: articleTitle },
      { label: "Filed by", value: byline },
      ...(submitted ? [{ label: "Received", value: submitted }] : []),
    ],
    cta: { label: "Open in the admin", url: articleUrl },
    finePrint:
      "You are receiving this because your account holds the admin role. Only admins are copied on the review queue. Writers and editors do not receive this note.",
    brand,
  });
}
