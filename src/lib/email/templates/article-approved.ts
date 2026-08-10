import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Sent to a writer when an editor moves their article from in_review to
 * published (or scheduled). Warm, congratulatory — the writer's byline is
 * live on the site now.
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
  /** ISO 8601 — set when the article is scheduled instead of live now. */
  scheduledFor?: string;
  brand?: string;
}): EmailShellOutput {
  const firstName = writerName?.trim().split(/\s+/)[0] ?? "there";
  const scheduled = scheduledFor
    ? new Date(scheduledFor).toUTCString()
    : undefined;
  const editorLine = editorName ? `${editorName} on the desk` : "The editorial desk";
  const kicker = scheduled ? "Scheduled" : "Published";
  const heading = scheduled ? "You're on the schedule." : "Your piece is live.";

  const paragraphs = [
    scheduled
      ? `Nice work, ${firstName}. ${editorLine} has approved "${articleTitle}" and set it to go live at the time below. When it publishes, it will appear on the front of the site — you don't need to do anything else.`
      : `Nice work, ${firstName}. ${editorLine} has published "${articleTitle}" — it is on the site right now, byline and all. Reads best with a coffee, we've heard.`,
    `Feel free to share the link with your people. If you spot a typo or want to file a follow-up, the admin is the fastest way in — everything else can wait.`,
  ];

  return renderEmailShell({
    subject: scheduled
      ? `"${articleTitle}" is scheduled to publish on ${brand}`
      : `"${articleTitle}" is now live on ${brand}`,
    preheader: scheduled
      ? `Your piece is on the schedule — details below.`
      : `Your piece is live. Read it, share it, take a beat.`,
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
      "You are receiving this because you are the byline on this article. Notifications for your own writing cannot be turned off.",
    brand,
  });
}
