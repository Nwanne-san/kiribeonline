import { APP_URL, sendTransactionalEmail } from "@/lib/email/resend";
import { renderArticleApprovedEmail } from "@/lib/email/templates/article-approved";
import { renderArticleChangesRequestedEmail } from "@/lib/email/templates/article-changes-requested";
import { renderArticleSubmittedEmail } from "@/lib/email/templates/article-submitted";
import { listActiveAdminRecipients } from "@/server/modules/users";
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
 * Notify every active admin that a writer just filed a piece for review.
 * Fire-and-forget from the caller. Recipients are looked up at send time so a
 * new admin added yesterday still gets today's mail. If no admins exist (fresh
 * install) or the list query fails, the caller is unaffected.
 */
export async function sendArticleSubmittedEmailToAdmins({
  articleTitle,
  articleId,
  writer,
  submittedAtISO,
}: {
  articleTitle: string;
  articleId: string;
  writer: { name?: string | null; email?: string | null; id?: string | number };
  submittedAtISO?: string;
}): Promise<{ recipients: number; sent: number }> {
  let admins: Array<{ id: string; email: string; name: string | null }> = [];
  try {
    admins = await listActiveAdminRecipients();
  } catch (err) {
    console.error("[articles] admin recipient lookup failed", err);
    return { recipients: 0, sent: 0 };
  }

  // A writer who is also an admin should not receive their own submission
  // notification — filter them out by id when available.
  const filtered = writer.id
    ? admins.filter((a) => a.id !== String(writer.id))
    : admins;

  if (filtered.length === 0) {
    return { recipients: 0, sent: 0 };
  }

  const { subject, html, text } = renderArticleSubmittedEmail({
    articleTitle,
    writerName: writer.name ?? null,
    writerEmail: writer.email ?? null,
    articleUrl: buildArticleEditUrl(articleId),
    submittedAtISO,
  });

  // One send per recipient so bounce handling and open/click tracking stay
  // per-address; Resend charges the same either way and a shared BCC would
  // conflate delivery signal across admins.
  const results = await Promise.all(
    filtered.map((admin) =>
      sendTransactionalEmail({
        to: admin.email,
        subject,
        html,
        text,
        context: "[articles] submitted for review",
      }).catch((err) => {
        console.error("[articles] admin notification failed", err);
        return false;
      }),
    ),
  );
  return {
    recipients: filtered.length,
    sent: results.filter((ok) => ok).length,
  };
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
