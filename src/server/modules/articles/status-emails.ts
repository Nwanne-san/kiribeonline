import { APP_URL, sendTransactionalEmail } from "@/lib/email/resend";
import { renderArticleApprovedEmail } from "@/lib/email/templates/article-approved";
import { renderArticleChangesRequestedEmail } from "@/lib/email/templates/article-changes-requested";
import { AdminRoutes } from "@/routes/admin.routes";
import { PublicRoutes } from "@/routes/public.routes";

type WriterRef = {
  email: string;
  name?: string | null;
};

type EditorRef = {
  name?: string | null;
};

function buildArticleEditUrl(id: string): string {
  return `${APP_URL}${AdminRoutes.articleEdit.replace(":id", encodeURIComponent(id))}`;
}

function buildArticlePublicUrl(slug: string): string {
  return `${APP_URL}${PublicRoutes.articleDetail.replace(":slug", encodeURIComponent(slug))}`;
}

/**
 * Notify a writer that an editor pushed their piece live (or onto the
 * schedule). Fire-and-forget from the caller so the mutation response is not
 * blocked. Returns `false` when Resend is unconfigured / the send failed.
 */
export async function sendArticleApprovedEmail({
  writer,
  editor,
  articleTitle,
  articleSlug,
  articleId,
  scheduledFor,
}: {
  writer: WriterRef;
  editor?: EditorRef;
  articleTitle: string;
  articleSlug: string;
  articleId: string;
  scheduledFor?: string;
}): Promise<boolean> {
  // Scheduled posts go to the admin preview until the cron flips them; live
  // posts link straight to the public URL so the writer can share it.
  const articleUrl = scheduledFor
    ? buildArticleEditUrl(articleId)
    : buildArticlePublicUrl(articleSlug);

  const { subject, html, text } = renderArticleApprovedEmail({
    writerName: writer.name ?? undefined,
    articleTitle,
    articleUrl,
    editorName: editor?.name ?? undefined,
    scheduledFor,
  });

  return sendTransactionalEmail({
    to: writer.email,
    subject,
    html,
    text,
    context: "[articles] approved",
  });
}

/**
 * Notify a writer that an editor sent their piece back for another pass. Fire-
 * and-forget from the caller; failure is logged and never surfaced.
 */
export async function sendArticleChangesRequestedEmail({
  writer,
  editor,
  articleTitle,
  articleId,
  note,
}: {
  writer: WriterRef;
  editor?: EditorRef;
  articleTitle: string;
  articleId: string;
  note?: string;
}): Promise<boolean> {
  const { subject, html, text } = renderArticleChangesRequestedEmail({
    writerName: writer.name ?? undefined,
    articleTitle,
    articleEditUrl: buildArticleEditUrl(articleId),
    editorName: editor?.name ?? undefined,
    note,
  });

  return sendTransactionalEmail({
    to: writer.email,
    subject,
    html,
    text,
    context: "[articles] changes requested",
  });
}
