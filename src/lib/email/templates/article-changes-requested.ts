import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Sent when an editor sends an article back for revisions (in_review → draft
 * or in_review → in_review with a note). Tone: constructive, not a rejection.
 * The piece is close, but the editor wants another pass.
 */
export function renderArticleChangesRequestedEmail({
  writerName,
  articleTitle,
  articleEditUrl,
  editorName,
  note,
  brand = "Kiribé",
}: {
  writerName?: string;
  articleTitle: string;
  articleEditUrl: string;
  editorName?: string;
  /** Optional editor note; rendered verbatim so keep it short. */
  note?: string;
  brand?: string;
}): EmailShellOutput {
  const firstName = writerName?.trim().split(/\s+/)[0] ?? "there";
  const editor = editorName ?? "The editorial desk";
  const trimmedNote = note?.trim();

  const paragraphs = [
    `Hi ${firstName} — ${editor} has taken a pass on "${articleTitle}" and would like another round of edits before it publishes. Nothing dramatic; just a few things they'd like your eyes on.`,
    trimmedNote
      ? `Here's what they left in the notes:`
      : `Open the piece in the admin to see the editor's inline comments and revise. Once you're ready, submit it for review again and it will pop back into their queue.`,
  ];

  return renderEmailShell({
    subject: `"${articleTitle}" needs one more pass`,
    preheader: `Not a rejection — an editor wants another look before it publishes.`,
    kicker: "Revisions requested",
    heading: "One more pass, and we're there.",
    paragraphs,
    infoRows: [
      { label: "Title", value: articleTitle },
      ...(editorName ? [{ label: "Editor", value: editorName }] : []),
      ...(trimmedNote ? [{ label: "Editor's note", value: trimmedNote }] : []),
    ],
    cta: { label: "Open in editor", url: articleEditUrl },
    finePrint:
      "Send it back to review whenever you're ready — there is no clock on this. If you'd like to talk it through instead of trading drafts, reply to this email and it will reach the editor directly.",
    brand,
  });
}
